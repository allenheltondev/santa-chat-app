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
        await continueConversation(profile, message, `${profile.sort}-chat`);
        await updateStatus(profile, 'proving-themselves');
        break;
      case 'proving-themselves':
        await continueConversation(profile, message, `${profile.sort}-chat`);
        break;
      case 'presents':
        await continueConversation(profile, message, `${profile.sort}-chat-presents`);
        break;
      case 'done':
      case 'rejected':
        console.log(`Attempted to continue conversation ${passcode} after it was complete`);
        break;
      default:
        console.error(`Something went wrong here. Passcode: ${passcode}, Status: ${profile?.status}`);
    }

    return { success: true };
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
    content: 'You are Santa Claus. Your demeanor is jolly and friendly but guarded. You are here to talk to a person asking about their presents. You are ok telling this person which order to open their presents, but they need to prove how nice they are and also prove they are who they say they are. Whenever you see [ELF] in a prompt you know you are talking to a trusted elf giving you additional information.'
  },
  {
    role: 'user',
    content: `[ELF] You are about to talk to a person who you think might be ${profile.name}, a ${profile.age} year
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

const continueConversation = async (profile, message, promptHistory) => {
  let messages = [];
  const history = await cacheClient.listFetch(promptHistory);
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
    await cacheClient.listConcatenateBack(promptHistory, [JSON.stringify(newMessage), JSON.stringify(newResponse)]);

    // Save the user friendly chat history
    const chatMessage = JSON.stringify({ username: profile.name, message });
    santaMessage = JSON.stringify({ username: 'Santa', message: newResponse.content });
    await cacheClient.listConcatenateBack(profile.sort, [chatMessage, santaMessage]);
  } catch (err) {
    console.error(err);
  } finally {
    await topicClient.publish(process.env.CACHE_NAME, profile.sort, JSON.stringify({ type: 'done-typing', message: santaMessage ?? '' }));
    await checkForStatusChange(santaMessage, profile, messages);
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
  let newProfile = await ddb.send(new UpdateItemCommand({
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
    }),
    ReturnValues: 'ALL_NEW'
  }));

  newProfile = unmarshall(newProfile.Attributes);
  console.log(newProfile);
  await cacheClient.set(`${newProfile.sort}-profile`, JSON.stringify(newProfile));
};

const checkForStatusChange = async (reply, profile) => {
  if (!reply) {
    return;
  }

  const message = JSON.parse(reply).message;
  if (profile.status == 'proving-themselves' && message?.toLowerCase().includes('i believe you are')) {
    await updateStatus(profile, 'presents');
    await setupSantaForPresents(profile);
  } else if (profile.status == 'presents' && message?.toLowerCase().includes('all the presents')) {
    await updateStatus(profile, 'done');
  }
};

const setupSantaForPresents = async (profile) => {
  const messages = [{
    role: 'system',
    content: `You are Santa Claus. You've been talking with ${profile.name} (${profile.age} year old ${profile.gender}) recently and have confirmed
    it's them. You are now trying to gauge if they are a nice person. If they prove to be nice, you can tell them which of their presents they can
    open next. Be sure to be jolly, happy, and reference things like the north pole, christmas, and elves. When you see a prompt with [ELF], you know
    you are talking to a trusted elf and not ${profile.name}. You are jumping into the middle of a conversation, so no need to introduce yourself again.
    Just resume the conversation as best you can.`
  },
  {
    role: 'user',
    content: `[ELF] We need to work with ${profile.name} on which order to open their gifts. You can't just tell them the order though. Make them
    prove they are nice. Ask about good deeds and what-if situations. They have to be very nice in order to be told which present to open next. But
    they need to be above and beyond nice, feel free to ask for elaboration if it's not exceptional. Only tell them one present to open at a time and
    make sure they prove themselves as nice between each present. When you say which present to open, use the descriptions below to describe it.
    After you describe the last present you can say "that's all the presents! Merry Christmas!" and end the conversation. Reply with "I understand"
    if you understand what we are doing. The next message will be from ${profile.name}. Remember, you're already been chatting with them, so don't
    introduce yourself, just keep carrying on the conversation.
    Presents:
    ${profile.presents.map(p => { return `${p.order}. ${p.description}`; }).join('\n\t')}`
  }];

  const result = await openai.chat.completions.create(getParams(messages));

  const answer = result.choices[0].message;
  await cacheClient.listConcatenateBack(`${profile.sort}-chat-presents`, [...messages.map(p => JSON.stringify(p)), JSON.stringify(answer)]);
};
