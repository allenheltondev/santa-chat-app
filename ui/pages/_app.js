import "../styles/globals.css";
import '@aws-amplify/ui-react/styles.css';
import 'react-toastify/dist/ReactToastify.css';
import 'react-contexify/ReactContexify.css';
import { Amplify } from "aws-amplify";
import { Flex, AmplifyProvider, Authenticator } from '@aws-amplify/ui-react';
import { CacheClient, TopicClient, CredentialProvider, Configurations } from '@gomomento/sdk-web';
import MomentoContext from "../services/MomentoContext";
import { Auth, API } from 'aws-amplify';
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
      const storedToken = localStorage.getItem('authToken');
      const expiresAt = localStorage.getItem('expiresAt');
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
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('expiresAt', response.exp);
        }
      }

      initialize(token);

    }

    initializeSDKs();
  }, []);

  const initialize = (token) => {
    if (!token)
      return;

    const client = new CacheClient({
      credentialProvider: CredentialProvider.fromString({ authToken: token }),
      configuration: Configurations.Browser.latest(),
      defaultTtlSeconds: 60
    });

    setCacheClient(client);
    localStorage.setItem('authToken', token);
  };

  return (
    <AmplifyProvider>
      <Authenticator hideSignUp variation="modal">
        <MomentoContext.Provider value={{ token, refreshToken }}>
          <Flex direction="column" width="100%">
            <Header />
            <Component {...pageProps} />
            <ToastContainer />
          </Flex>
        </MomentoContext.Provider>
      </Authenticator>
    </AmplifyProvider>
  );
}

export default MyApp;
