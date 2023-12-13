const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const { getSecret } = require('@aws-lambda-powertools/parameters/secrets');
const { CacheClient, CredentialProvider, Configurations, CacheSet } = require('@gomomento/sdk');

let cacheClient;
const ddb = new DynamoDBClient();

exports.handler = async (event) => {
  try {
    const { passcode } = event.pathParameters;
    const tenantId = event.requestContext.authorizer.claims.sub;

    const response = await ddb.send(new UpdateItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: marshall({
        pk: tenantId,
        sk: `profile#${passcode}`
      }),
      ConditionExpression: 'attribute_exists(pk) and attribute_exists(sk)',
      UpdateExpression: 'REMOVE #status, #giftNumber',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#giftNumber': 'giftNumber'
      },
      ReturnValues: 'ALL_NEW'
    }));

    await updateCache(passcode, unmarshall(response.Attributes));

    return {
      statusCode: 204,
      headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
    };
  } catch (err) {
    if (error.name == 'ConditionalCheckFailedException') {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Could not find a profile with the provided passcode' }),
        headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
      };
    }
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Something went wrong' }),
      headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
    };
  }
};

const updateCache = async (passcode, profile) => {
  if (!cacheClient) {
    const secret = await getSecret(process.env.SECRET_ID, { transform: 'json' });
    cacheClient = await CacheClient.create({
      credentialProvider: CredentialProvider.fromString({ apiKey: secret.momento }),
      configuration: Configurations.Lambda.latest(),
      defaultTtlSeconds: 14400 // 4 hours
    });
  }

  const response = await cacheClient.set(process.env.CACHE_NAME, `${passcode}-profile`, JSON.stringify(profile));
  if (response instanceof CacheSet.Error) {
    console.error(response.errorCode(), response.message());
  }

  await cacheClient.delete(process.env.CACHE_NAME, `${passcode}-chat`);
  await cacheClient.delete(process.env.CACHE_NAME, passcode);
};
