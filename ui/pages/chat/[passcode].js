import React, { useEffect, useState, useRef, useContext } from 'react';
import { Flex, Heading, Button, Text, View } from '@aws-amplify/ui-react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { CacheListFetch } from '@gomomento/sdk-web';
import MomentoContext from '../../services/MomentoContext';

const INTRO_MESSAGE = "Ho, ho, ho! It's good to hear from you! Before we do anything, I need to verify that it's actually you. I'm going to ask you a few questions. First, what is your full name?";

const Chat = () => {
  const router = useRouter();
  const { passcode } = router.query;
  const { cacheClient, topicClient, initialize } = useContext(MomentoContext);

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [santaIsTyping, setSantaIsTyping] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const messagesRef = useRef(messages);
  const chatWindowRef = useRef(null);
  const currentMessageRef = useRef(currentMessage);

  const updateMessages = (newMessages) => {
    messagesRef.current = newMessages;
    setMessages(newMessages);
  };

  const updateCurrentMessage = (messagePiece) => {
    const newCurrentMessage = currentMessageRef.current + messagePiece;
    currentMessageRef.current = newCurrentMessage;
    setCurrentMessage(newCurrentMessage);
  };

  useEffect(() => {
    const sessionName = sessionStorage.getItem('name');
    if (!sessionName) {
      router.push('/');
    } else {
      subscribeToPasscode();
    }
    setName(sessionName);

  }, [topicClient, passcode]);

  const subscribeToPasscode = async () => {
    if (!topicClient) {
      await initialize(passcode);
    }
    if (topicClient && passcode) {
      const subscription = await topicClient?.subscribe(process.env.NEXT_PUBLIC_cacheName, passcode, {
        onItem: async (data) => await processMessage(data.value()),
        onError: (err) => console.error(err)
      });

      console.log(subscription);
    }
  };

  const processMessage = (message) => {
    const msg = JSON.parse(message);
    switch (msg.type) {
      case 'start-typing':
        setSantaIsTyping(true);
        break;
      case 'done-typing':
        setSantaIsTyping(false);
        updateCurrentMessage('');
        console.log(msg.message);
        updateMessages([JSON.parse(msg.message), ...messagesRef.current]);
        break;
      case 'partial-message':
        updateCurrentMessage(msg.content);
        break;
    }

  };

  useEffect(() => {
    messagesRef.current = messages;
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (cacheClient && !messages?.length) {
      loadChatHistory();
    }
  }, [cacheClient]);


  const loadChatHistory = async () => {
    let history = [];
    const chatHistoryResponse = await cacheClient.listFetch(process.env.NEXT_PUBLIC_cacheName, passcode);
    if (chatHistoryResponse instanceof CacheListFetch.Hit) {
      history = chatHistoryResponse.valueListString().map(msg => JSON.parse(msg));
    }
    if (!history.length) {
      history.push({ username: 'Santa', message: INTRO_MESSAGE });
    }
    updateMessages(history);
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const msg = { username: name, message: message };
    setMessages([msg, ...messages]);
    topicClient.publish(process.env.NEXT_PUBLIC_cacheName, 'santa-chat', message);
    setMessage("");
  };

  return (
    <View>
      <Head>
        <title>{router.query.room} Chat with Santa</title>
      </Head>
      <Flex direction="row" alignItems="center" justifyContent="center" textAlign="center">
        <Heading level={4}>Christmas Chat with Santa</Heading>
      </Flex>
      <Flex
        direction="column"
        height={'calc(90vh - 100px)'}
        maxWidth="600px"
        margin="0 auto"
        marginTop="1em"
        border="1px solid #ddd"
        backgroundColor="white"
        borderRadius="medium"
        gap=".2em"
      >
        <ul style={{ flexGrow: 1, listStyleType: 'none', margin: 0, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse' }}>
          {santaIsTyping && (
            <li key='santacurrentmessage' style={{ marginBottom: '10px', padding: '10px', borderRadius: '5px', backgroundColor: '#D2E5A8' }}>
              <strong>Santa: </strong>{currentMessage}
            </li>
          )}
          {messages.map((msg, index) => (
            <li key={index} style={{ marginBottom: '10px', padding: '10px', borderRadius: '5px', backgroundColor: msg.username === name ? '#f1f1f1' : '#D2E5A8' }}>
              <strong>{msg.username}: </strong>{msg.message}
            </li>
          ))}
        </ul>
        <View ref={chatWindowRef} />
        {santaIsTyping && <Text marginLeft="1em" marginBottom="0em" fontStyle="italic" fontSize="14px">Santa is typing...</Text>}
        <Flex backgroundColor="#f5f5f5" padding="10px">
          <input
            type="text"
            style={{ flexGrow: 1, boxSizing: 'border-box', border: '1px solid #ddd', padding: "10px", borderRadius: '4px', outline: 'none', fontSize: '16px' }}
            placeholder="Type your message here"
            value={message}
            onChange={event => setMessage(event.target.value)}
            onKeyDown={event => event.key === 'Enter' ? sendMessage(event) : null}
          />
          <Button backgroundColor="#80B2FF" color="black" onClick={e => sendMessage(e)}>Send</Button>
        </Flex>
      </Flex>
    </View>
  );
};

export default Chat;
