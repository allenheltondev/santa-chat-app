import "../styles/globals.css";
import '@aws-amplify/ui-react/styles.css';
import 'react-toastify/dist/ReactToastify.css';
import 'react-contexify/ReactContexify.css';
import { Amplify } from "aws-amplify";
import { Flex, AmplifyProvider } from '@aws-amplify/ui-react';
import { CacheClient, TopicClient, CredentialProvider, Configurations } from '@gomomento/sdk-web';
import MomentoContext from "../services/MomentoContext";
import { API } from 'aws-amplify';
import { config } from "../config";
import Header from "../components/Header";
import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';

Amplify.configure(config);

function MyApp({ Component, pageProps }) {
  const [cacheClient, setCacheClient] = useState(null);
  const [topicClient, setTopicClient] = useState(null);

  useEffect(() => {
    async function initializeSDKs() {
      const storedToken = sessionStorage?.getItem('authToken');
      const expiresAt = sessionStorage?.getItem('expiresAt');
      const currentTime = new Date().getTime();

      let token;

      if (storedToken && expiresAt && currentTime < Number(expiresAt)) {
        token = storedToken; // Use the stored token
      } else {
        const sessionPasscode = sessionStorage?.getItem('passcode');
        if (sessionPasscode) {
          const response = await API.post('Public', `/${sessions}`, {
            body: { passcode: sessionPasscode }
          });
          sessionStorage?.setItem('authToken', response.token);
          sessionStorage?.setItem('expiresAt', response.exp);
        }
      }

      initialize(token);

    }

    initializeSDKs();
  }, []);

  const initialize = (token, exp) => {
    if (!token) {
      token = sessionStorage?.getItem('authToken');
    }
    if (!token)
      return;

    const client = new CacheClient({
      credentialProvider: CredentialProvider.fromString({ authToken: token }),
      configuration: Configurations.Browser.latest(),
      defaultTtlSeconds: 60
    });

    const topics = new TopicClient({
      configuration: Configurations.Browser.latest(),
      credentialProvider: CredentialProvider.fromString({ authToken: token })
    });

    setCacheClient(client);
    setTopicClient(topics);
    sessionStorage?.setItem('authToken', token);
    if (exp) {
      sessionStorage?.setItem('expiresAt', exp);
    }
  };

  const refreshSDKs = async (passcode) => {
    if (!passcode) {
      const sessionPasscode = sessionStorage?.getItem('passcode');
      passcode = sessionPasscode;
    }

    if (passcode) {
      const response = await API.post('Public', `/${sessions}`, {
        body: { passcode: sessionPasscode }
      });
      sessionStorage?.setItem('authToken', response.token);
      sessionStorage?.setItem('expiresAt', response.exp);
    }
  };

  return (
    <AmplifyProvider>
      <MomentoContext.Provider value={{ cacheClient, topicClient, refreshSDKs, initialize }}>
        <Flex direction="column" width="100%">
          <Header />
          <Component {...pageProps} />
          <ToastContainer />
        </Flex>
      </MomentoContext.Provider>
    </AmplifyProvider>
  );
}

export default MyApp;
