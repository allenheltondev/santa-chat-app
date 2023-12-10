import React, { useEffect, useState, useRef, useContext } from 'react';
import { useRouter } from 'next/router';
import { FaArrowLeft } from 'react-icons/fa';
import Head from 'next/head';
import { CacheListFetch } from '@gomomento/sdk-web';
import MomentoContext from '../../services/MomentoContext';

const Chat = () => {
  const router = useRouter();
  const { passcode } = router.query;
  const { cacheClient, topicClient, refreshSDKs} = useContext(MomentoContext);

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesRef = useRef(messages);
  const chatWindowRef = useRef(null);

  const updateMessages = (newMessages) => {
    messagesRef.current = newMessages;
    setMessages(newMessages);
  };

  useEffect(() => {
    const initialize = async () => {
      await refreshSDKs(passcode);
      await topicClient.subscribe(process.env.NEXT_PUBLIC_cacheName, passcode, {
        onItem: async (data) => await processMessage(data.value()),
        onError: (err) => console.error(err)
      });
    }

    if(!cacheClient && passcode){
      initialize();
    }
  }, [passcode]);

  const processMessage = (message) => {
    console.log(message);
  }

  useEffect(() => {
    messagesRef.current = messages;
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if(cacheClient && !messages?.length){
      loadChatHistory();
    }
  }, [cacheClient]);


  const loadChatHistory = async () => {
    const chatHistoryResponse = await cacheClient.listFetch(process.env.NEXT_PUBLIC_cacheName, passcode);
    if (chatHistoryResponse instanceof CacheListFetch.Hit) {
      const history = chatHistoryResponse.valueListString().map(msg => JSON.parse(msg));
      updateMessages(history);
    }
  };

  const saveMessage = async (newMessage) => {
    const detail = JSON.parse(newMessage);
    updateMessages([detail, ...messagesRef.current]);
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const msg = JSON.stringify({ username: name, message: message });
    topicClient.publish('chat', `${router.query.room}-chat`, msg);
    setMessage("");
    cacheClient.listPushFront('chat', router.query.room, msg);
  };

  return (
    <div>
      <Head>
        <title>{router.query.room} Chat | Momento</title>
      </Head>
      <div className={styles['header']}>
        <div onClick={() => router.push('/')} className={styles['back-button']}>
          <FaArrowLeft size={30} color='white' />
        </div>
        <h1 className={styles.h1}>{router.query.room} Chat</h1>
      </div>
      <div className={styles['chat-container']}>
        <ul className={styles.messages}>
          {messages.map((msg, index) => (
            <li key={index} className={msg.username === name ? styles['my-message'] : styles['message']}>
              <strong>{msg.username}: </strong>{msg.message}
            </li>
          ))}
        </ul>
        <div ref={chatWindowRef} />
        <div className={styles['user-info']}>You are logged in as {name}</div>
        <div className={styles['input-container']}>
          <input
            type="text"
            className={styles['text-input']}
            placeholder="Type your message here"
            value={message}
            onChange={event => setMessage(event.target.value)}
            onKeyPress={event => event.key === 'Enter' ? sendMessage(event) : null}
          />
          <button className={styles.btn} onClick={e => sendMessage(e)}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
