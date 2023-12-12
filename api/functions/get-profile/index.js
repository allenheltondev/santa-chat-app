const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const ddb = new DynamoDBClient();

exports.handler = async (event) => {
  try {
    const tenantId = event.requestContext.authorizer.claims.sub;
    const { passcode } = event.pathParameters;

    const response = await ddb.send(new GetItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: marshall({
        pk: tenantId,
        sk: `profile#${passcode}`
      })
    }));

    if (!response.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'The requested profile is not found' }),
        headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
      };
    }

    const data = unmarshall(response.Item);

    return {
      statusCode: 200,
      body: JSON.stringify({
        passcode: data.sort,
        name: data.name,
        status: data.status ?? 'Not started',
        age: data.age,
        gender: data.gender,
        ...data.facts && { facts: data.facts },
        ...data.presents && { presents: data.presents }
      }),
      headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Something went wrong' }),
      headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
    };
  }
};
