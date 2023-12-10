const { getSecret } = require('@aws-lambda-powertools/parameters/secrets');
const { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { DynamoDBClient, QueryCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const { TopicClient, CacheClient, CredentialProvider, Configurations, CacheGet, CacheListFetch } = require('@gomomento/sdk');

const bedrock = new BedrockRuntimeClient();
const ddb = new DynamoDBClient();
let topicClient;
let cacheClient;

exports.handler = async (event) => {
  try {
    const { passcode, message } = event.detail;
    await initializeClients();
    const profile = await getProfile(passcode);
    if (!profile)
      return { success: false };

    switch (profile.status) {
      case undefined:
        await startNewConversation(profile);
        await continueConversation(profile, message);
        await updateStatus(profile, 'proving-themselves');
        break;
      case 'proving-themselves':
      case 'presents':
        await continueConversation(profile, message);
        break;
    }
  } catch (err) {
    console.error(err);
    return { success: false };
  }
};

const initializeClients = async () => {
  if (topicClient && cacheClient)
    return;

  const secret = await getSecret(process.env.SECRET_ID, { transform: 'json' });
  topicClient = new TopicClient({
    credentialProvider: CredentialProvider.fromString({ apiKey: secret.momento }),
    configuration: Configurations.Lambda.latest()
  });
  cacheClient = await CacheClient.create({
    credentialProvider: CredentialProvider.fromString({ apiKey: secret.momento }),
    configuration: Configurations.Lambda.latest(),
    defaultTtlSeconds: 14400 // 4 hours
  });

  cacheClient = cacheClient.cache(process.env.CACHE_NAME);
};

const getProfile = async (passcode) => {
  try {
    const cachedProfile = await cacheClient.get(`${passcode}-profile`);
    if (cachedProfile instanceof CacheGet.Hit) {
      return JSON.parse(cachedProfile.value());
    }
    else {
      const response = await ddb.send(new QueryCommand({
        TableName: process.env.TABLE_NAME,
        IndexName: 'types',
        KeyConditionExpression: '#type = :type and #passcode = :passcode',
        ExpressionAttributeNames: {
          '#type': 'type',
          '#passcode': 'sort'
        },
        ExpressionAttributeValues: marshall({
          ':type': 'profile',
          ':passcode': passcode
        }),
        Limit: 1
      }));

      if (!response.Items.length) {
        throw new Error(`Profile not found: ${passcode}`);
      }

      const profile = unmarshall(response.Items[0]);
      await cacheClient.set(`${passcode}-profile`, JSON.stringify(profile));

      return profile;
    }
  } catch (err) {
    console.error('Error loading profile:', err);
  }
};

const startNewConversation = async (profile) => {
  const prompt = `[INST] You are Santa Claus. You are about to talk to a person who you think might be ${profile.name}, a ${profile.age} year
  old ${profile.gender}. Below are a few facts about ${profile.name} that you can use to ask questions to test if it's them. Be tricky and
  ask them only questions they would know. It's ok to ask trick questions to see if they respond incorrectly. Once you're sure this person is
  definitely ${profile.name}, respond with "Ok, I believe you are ${profile.name}." Be sure to make references to things like elves,
  the north pole, presents, etc..
  Facts:
    - ${profile.facts.join('\n\t- ')}
  Respond only with "I understand" if you understand. The next message will be this person. [/INST]`;

  const params = getBedrockParams(prompt);
  const response = await bedrock.send(new InvokeModelCommand(params));

  const answer = JSON.parse(new TextDecoder().decode(response.body));
  console.log(answer);
  const completion = answer.generation;
  console.log(completion);
  await cacheClient.listConcatenateBack(`${profile.sort}-chat`, [prompt, completion]);
};

const continueConversation = async (profile, message) => {
  let messages = [];
  const history = await cacheClient.listFetch(`${profile.sort}-chat`);
  if (history instanceof CacheListFetch.Hit) {
    messages = history.value();
  } else {
    console.warn(`Could not find conversation history for ${profile.sort}`);
  }
  try {
    await topicClient.publiish(process.env.CACHE_NAME, profile.sort, JSON.stringify({ type: 'start-typing' }));
    const newMessage = `[INST]${message}[/INST]`;
    let prompt = messages.join('\n');
    prompt += `\n${newMessage}`;

    const params = getBedrockParams(prompt);
    const response = await bedrock.send(new InvokeModelWithResponseStreamCommand(params));
    const chunks = [];
    for await (const chunk of response.body) {
      const message = JSON.parse(
        Buffer.from(chunk.chunk.bytes, "base64").toString("utf-8")
      );

      await topicClient.publish(process.env.CACHE_NAME, profile.sort, JSON.stringify({ type: 'partial-message', content: message.generation }));
      chunks.push(message.generation);
    }

    const newResponse = chunks.join('');

    // Save the prompt message history
    await cacheClient.listConcatenateBack(`${profile.sort}-chat`, [newMessage, newResponse]);

    // Save the user friendly chat history
    const chatMessage = JSON.stringify({ username: profile.name, message });
    const santaMessage = JSON.stringify({ username: 'Santa', message: newResponse });
    await cacheClient.listConcatenateBack(profile.sort, [chatMessage, santaMessage]);
  } catch (err) {
    console.error(err);
  } finally {
    await topicClient.publiish(process.env.CACHE_NAME, profile.sort, JSON.stringify({ type: 'done-typing' }));
  }
};

const getBedrockParams = (prompt) => {
  return {
    modelId: 'meta.llama2-70b-chat-v1',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      prompt,
      temperature: .6,
      max_gen_len: 512,
      top_p: .9
    })
  };
};

const updateStatus = async (profile, status) => {
  await ddb.send(new UpdateItemCommand({
    TableName: process.env.TABLE_NAME,
    Key: marshall({
      pk: profile.pk,
      sk: profile.sk
    }),
    UpdateExpression: 'SET #status = :status',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: marshall({
      ':status': status
    })
  }));
};
