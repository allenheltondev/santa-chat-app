const { AuthClient, CredentialProvider, ExpiresIn, TopicRole, GenerateDisposableToken, CacheRole } = require('@gomomento/sdk');
const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
const { getSecret } = require('@aws-lambda-powertools/parameters/secrets');

const ddb = new DynamoDBClient();
let authClient;

exports.handler = async (event) => {
  try {
    let { passcode } = JSON.parse(event.body);
    passcode = passcode.toUpperCase();

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

    if (!response.Items?.length) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Invalid passcode' }),
        headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
      };
    }

    await initializeAuthClient();

    const scope = {
      permissions: [
        {
          role: CacheRole.ReadOnly,
          cache: process.env.CACHE_NAME,
          item: {
            key: passcode
          }
        },
        {
          role: TopicRole.PublishOnly,
          cache: process.env.CACHE_NAME,
          topic: 'santa-chat'
        },
        {
          role: TopicRole.SubscribeOnly,
          cache: process.env.CACHE_NAME,
          topic: passcode
        }
      ]
    };

    const tokenResponse = await authClient.generateDisposableToken(scope, ExpiresIn.hours(1), { tokenId: passcode });
    if (tokenResponse instanceof GenerateDisposableToken.Success) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          token: tokenResponse.authToken,
          exp: tokenResponse.expiresAt.epoch(),
          name: response.Items[0].name.S
        }),
        headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
      };
    } else {
      console.error(tokenResponse.errorCode(), tokenResponse.message());
      throw new Error('Could not create auth token');
    }
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Something went wrong' }),
      headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
    };
  }
};

const initializeAuthClient = async () => {
  if (authClient)
    return;

  const secret = await getSecret(process.env.SECRET_ID, { transform: 'json' });
  authClient = new AuthClient({
    credentialProvider: CredentialProvider.fromString({ apiKey: secret.momento })
  });
};
