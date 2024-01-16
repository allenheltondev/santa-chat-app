const crypto = require('crypto');
const { getSecret } = require('@aws-lambda-powertools/parameters/secrets');
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');

const eventbridge = new EventBridgeClient();

exports.handler = async (event) => {
  try {
    const { body } = event;
    const message = await validateRequest(body, event.headers['momento-signature']);
    if (!message || !message.token_id) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'Unauthorized' }),
        headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
      };
    }

    // Offload processing to a different function to return a success back to webhook delivery quickly
    await eventbridge.send(new PutEventsCommand({
      Entries: [
        {
          Source: 'webhook',
          DetailType: 'New Chat Message',
          Detail: JSON.stringify({
            passcode: message.token_id,
            message: message.text
          })
        }
      ]
    }));

    return {
      statusCode: 200,
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

const validateRequest = async (body, signature) => {
  try {
    if (!body || !signature) {
      return;
    }

    const hash = await getHash();
    const hashed = hash.update(body).digest('hex');
    if (hashed !== signature) {
      console.warn('Invalid signature on request');
      return;
    }

    const payload = JSON.parse(body);
    const { publish_timestamp } = payload;
    const timeSincePublish = new Date().getTime() - publish_timestamp;
    if (timeSincePublish > 60000) {// make sure events are less than 1 minute old
      console.warn('Event is older than allowed buffer (1 min)');
      return;
    }

    return payload;
  } catch (err) {
    console.warn('message payload was not valid JSON');
  }
};

const getHash = async () => {
  const secret = await getSecret(process.env.SECRET_ID, { transform: 'json' });
  const webhookHash = crypto.createHmac('SHA3-256', secret.webhook);
  return webhookHash;
};

