const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb')
const ddb = new DynamoDBClient();

exports.handler = async (event) => {
  try {
    const response = await ddb.send(new QueryCommand({
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: 'pk = :pk and begins_with(sk, :sk)',
      ExpressionAttributeValues: marshall({
        ':pk': event.requestContext.authorizer.claims.sub,
        ':sk': 'profile#'
      })
    }));

    const profiles = response.Items.map(item => {
      const data = unmarshall(item);
      return {
        passcode: data.sort,
        name: data.name,
        status: data.status ?? 'Not started'
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ profiles }),
      headers: {
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN,
        'Cache-Control': 'max-age=60 public must-revalidate'
      }
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
