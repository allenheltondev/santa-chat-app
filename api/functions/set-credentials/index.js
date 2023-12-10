const { SSMClient, PutParameterCommand } = require("@aws-sdk/client-ssm");
const ssm = new SSMClient();

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    await ssm.send(new PutParameterCommand({
      Name: `santa-chat/${event.requestContext.authorizer.claims.sub}`,
      Type: 'SecureString',
      Value: JSON.stringify({
        openai: body.openAiKey
      }),
      Overwrite: true
    }));

    return {
      statusCode: 204,
      headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Something went wrong' }),
      headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
    };
  }
};
