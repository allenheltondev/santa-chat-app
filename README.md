# Chat With Santa

Ho, ho, ho and welcome! This repository was built both to be a fun and frustrating experience for my brother on Christmas and as an entry into the [Serverless Guru Hackathon](https://hackathon.serverless.guru/).

To read all about it and get some fun insider information on how it was built and the iterations it went through, [check out the blog post](https://readysetcloud.io/blog/allen.helton/santa-chatbot). To see it live, go to [www.justinschristmasgift.com](https://justinschristmasgift.com).

## Architecture

This repository is a mono-repo containing both the front-end and backend code. When deployed into your account, it will create the following architecture:

![](https://readysetcloud.s3.amazonaws.com/santa_chatbot_1.png)

Control plane operations go through a REST API and the majority of the data plane/chat operations go through [Momento Topics](https://www.gomomento.com/services/topics).

![](https://readysetcloud.s3.amazonaws.com/santa_chatbot_2.png)

## Deployment

To deploy this into your AWS account, you will need the [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html#install-sam-cli-instructions) installed and configured on your machine.

Prior to deployment, you will need to gather the following information:

* **Momento API Key** - Create a super user API key via the [Momento Console](https://console.gomomento.com)
* **OpenAI API Key** - Create an API key for [OpenAI](https://openai.com/blog/openai-api)
* **Webhook Secret** - Create a webhook in your Momento account and remember the secret
* **Default Cache Name** - Create a cache in your Momento account

Once you have obtained all the information above, you can deploy the code into your AWS account via the following commands:

```bash
cd api
sam build --parallel
sam deploy --guided
```

## Repo Layout

All the source code for the NextJS front-end is located in the `ui` folder off the root. The backend code for the API is in the `api` folder.

## Contact

Any questions? Feel free to reach me on [X](https://twitter.com/allenheltondev) or [LinkedIn](https://linkedin.com/in/allenheltondev)
