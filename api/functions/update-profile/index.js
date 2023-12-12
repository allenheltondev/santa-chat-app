const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
const ddb = new DynamoDBClient();

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const tenantId = event.requestContext.authorizer.claims.sub;
    const { passcode } = event.pathParameters;

    await ddb.send(new PutItemCommand({
      TableName: process.env.TABLE_NAME,
      ConditionExpression: 'attribute_exists(pk) and attribute_exists(sk)',
      Item: marshall({
        pk: tenantId,
        sk: `profile#${passcode}`,
        type: 'profile',
        sort: passcode,
        ...body
      })
    }));

    return {
      statusCode: 204,
      headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
    };
  } catch (err) {
    console.error(err);
    if (err.name == 'ConditionalCheckFailedException') {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'The requested profile is not found' }),
        headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Something went wrong' }),
        headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
      };
    }
  }
};
