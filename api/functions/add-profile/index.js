const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
const ddb = new DynamoDBClient();

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const tenantId = event.requestContext.authorizer.claims.sub;

    for (let i = 0; i < 5; i++) {
      const profilePasscode = getProfilePasscode();
      let success = true;
      try {
        await saveProfile(tenantId, profilePasscode, body);
      } catch (err) {
        if (err.name == 'ConditionalCheckFailedException') {
          success = false;
        } else {
          throw err;
        }
      }
      if (success) {
        return {
          statusCode: 201,
          body: JSON.stringify({ passcode: profilePasscode }),
          headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
        };
      }
    }

    // This means we tried 5 times for a unique value but couldn't find one. Let the user try again.
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Unable to generate unique passcode. Please try again' }),
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

const saveProfile = async (tenantId, profilePasscode, body) => {
  await ddb.send(new PutItemCommand({
    TableName: process.env.TABLE_NAME,
    ConditionExpression: 'attribute_not_exists(sort)',
    Item: marshall({
      pk: tenantId,
      sk: `profile#${profilePasscode}`,
      type: 'profile',
      sort: profilePasscode,
      ...body
    })
  }));
};

const getProfilePasscode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
