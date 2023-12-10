import { Flex, Card, Heading } from "@aws-amplify/ui-react";
import { useEffect, useState } from "react";
import { useRouter } from 'next/router';
import { Auth } from 'aws-amplify';
import Head from "next/head";
import { IoArrowBack } from 'react-icons/io5';
import ContentForm from "../../components/ContentForm";

const defaultContent = {
  services: [],
  type: [],
  audience: 'Executives',
  seoKeyword: 'None'
}

const CreateContentPage = () => {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [content, setContent] = useState(defaultContent);

  useEffect(() => {
    const configureJwt = async () => {
      try {
        const session = await Auth.currentSession();
        const jwt = session.getIdToken().getJwtToken();
        setToken(jwt);
      } catch (err) {
        console.error(err);
      }
    };

    configureJwt();
  }, []);

  return (
    <>
      <Head>
        <title>Submit New Content | Momento Content</title>
      </Head>
      <Flex direction="column" width="100%" alignItems="center" gap="1em" height="85vh">
        <Card variation="elevated" width="80%">
          <Flex direction="row" gap="1em" alignItems="center">
            <IoArrowBack size="1.5em" color="black" cursor="pointer" onClick={() => router.back()} />
            <Heading level={4}>Submit An Idea</Heading>
          </Flex>
        </Card>
        <Flex width="80%" flex={1}>
          <ContentForm token={token} content={content} setContent={setContent} isNewContent={true} />
        </Flex>
      </Flex>
    </>
  );
};

export default CreateContentPage;
