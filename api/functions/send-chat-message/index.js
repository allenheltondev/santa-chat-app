const { getSecret } = require('@aws-lambda-powertools/parameters/secrets');
const { DynamoDBClient, QueryCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const { TopicClient, CacheClient, CredentialProvider, Configurations, CacheGet, CacheListFetch, TopicPublish } = require('@gomomento/sdk');
const OpenAI = require('openai');

const ddb = new DynamoDBClient();
let openai;
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
  if (topicClient && cacheClient && openai)
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

  openai = new OpenAI({ apiKey: secret.openai });
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
  const prompts = [{
    role: 'system',
    content: 'You are Santa Claus. Your demeanor is jolly and friendly but guarded. You are here to talk to a person asking about their presents. You are ok telling this person which order to open their presents, but they need to prove how nice they are and also prove they are who they say they are.'
  },
  {
    role: 'user',
    content: `You are about to talk to a person who you think might be ${profile.name}, a ${profile.age} year
    old ${profile.gender}. Below are a few facts about ${profile.name} that you can use to ask questions to test if it's them. Be tricky and
    ask them only questions they would know. It's ok to ask trick questions to see if they respond incorrectly. Once you're sure this person is
    definitely ${profile.name}, respond with "Ok, I believe you are ${profile.name}." Be sure to make references to things like elves,
    the north pole, presents, etc.. Ask only one question at a time and ask at least 3 questions with respect to the following facts.
    Facts:
      - ${profile.facts.join('\n\t- ')}
    Respond only with "I understand" if you understand. The next message will be this person stating their name.`
  }];

  const result = await openai.chat.completions.create(getParams(prompts));

  const answer = result.choices[0].message;
  await cacheClient.listConcatenateBack(`${profile.sort}-chat`, [...prompts.map(p => JSON.stringify(p)), JSON.stringify(answer)]);
};

const continueConversation = async (profile, message) => {
  let messages = [];
  const history = await cacheClient.listFetch(`${profile.sort}-chat`);
  if (history instanceof CacheListFetch.Hit) {
    messages = history.value().map(h => JSON.parse(h));
  } else {
    console.warn(`Could not find conversation history for ${profile.sort}`);
  }
  let santaMessage;
  try {
    await topicClient.publish(process.env.CACHE_NAME, profile.sort, JSON.stringify({ type: 'start-typing' }));
    const newMessage = {
      role: 'user',
      content: message
    };
    messages.push(newMessage);

    const params = getParams(messages);
    params.stream = true;

    const stream = await openai.beta.chat.completions.stream(params);

    for await (const chunk of stream) {
      const message = chunk.choices[0]?.delta?.content;
      if (message) {
        const pubResponse = await topicClient.publish(process.env.CACHE_NAME, profile.sort, JSON.stringify({ type: 'partial-message', content: message }));
        if (pubResponse instanceof TopicPublish.Error) {
          console.error(pubResponse.errorCode(), pubResponse.message());
        }
      }
    }

    const completion = await stream.finalChatCompletion();
    const newResponse = completion.choices[0].message;

    // Save the prompt message history
    await cacheClient.listConcatenateBack(`${profile.sort}-chat`, [JSON.stringify(newMessage), JSON.stringify(newResponse)]);

    // Save the user friendly chat history
    const chatMessage = JSON.stringify({ username: profile.name, message });
    santaMessage = JSON.stringify({ username: 'Santa', message: newResponse.content });
    await cacheClient.listConcatenateBack(profile.sort, [chatMessage, santaMessage]);
  } catch (err) {
    console.error(err);
  } finally {
    await topicClient.publish(process.env.CACHE_NAME, profile.sort, JSON.stringify({ type: 'done-typing', message: santaMessage ?? '' }));
  }
};

const getParams = (messages) => {
  return {
    model: 'gpt-4-1106-preview',
    temperature: .7,
    messages
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
