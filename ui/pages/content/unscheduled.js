import { useEffect, useState } from 'react';
import { Flex, Card, Heading, Table, TableBody, TableCell, TableHead, TableRow, Loader, Text } from '@aws-amplify/ui-react';
import Head from 'next/head';
import { API, Auth } from 'aws-amplify';
import { MdRefresh } from 'react-icons/md';
import ContentRow from '../../components/ContentRow';

const UnscheduledContentPage = () => {
  const [content, setContent] = useState([]);
  const [token, setToken] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const configureJwt = async () => {
      const session = await Auth.currentSession();
      const jwt = session.getIdToken().getJwtToken();
      const user = await Auth.currentUserInfo();
      setUserEmail(user.attributes.email);
      setToken(jwt);
    }

    configureJwt();
  }, []);

  useEffect(() => {
    if (token) {
      refresh();
    }
  }, [token]);

  const refresh = async () => {
    setIsFetching(true);
    try {
      const response = await API.get('ContentApi', `/unscheduled`, { headers: { Authorization: `Bearer ${token}` } });
      setContent(response.content);
    } catch (err) {
      console.error(err);
    }
    finally {
      setIsFetching(false);
    }
  };

  return (
    <>
      <Head>
        <title>Unscheduled Content</title>
      </Head>
      <Flex direction="column" width="100%" alignItems="center">
        <Flex direction="column" width="90%">
          <Card variation="elevated" textAlign="center" width="100%" padding="small">
            <Flex direction="column" alignItems="center" justifyContent="center" gap=".1em">
              <Heading level={3}>Unscheduled Content</Heading>
              <Text >Ideas for content are below. Feel free to schedule them in upcoming months.</Text>
            </Flex>
          </Card>
          <Table highlightOnHover="true" backgroundColor="white" boxShadow="medium" size="small">
            <TableHead >
              <TableRow backgroundColor="#25392B">
                <TableCell as="th" fontSize="large" color="white">Type</TableCell>
                <TableCell as="th" fontSize="large" color="white">Title</TableCell>
                <TableCell as="th" fontSize="large" color="white">Services</TableCell>
                <TableCell as="th" fontSize="large" color="white">Status</TableCell>
                <TableCell as="th" fontSize="large" color="white">Scheduled Date</TableCell>
                <TableCell as="th" > {isFetching ? <Loader size="2em" /> : <MdRefresh size="2em" cursor="pointer" color="white" onClick={refresh} />}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {content?.map((post) => (
                <ContentRow content={post} jwt={token} refresh={refresh} key={post.id} user={userEmail} />
              ))}
            </TableBody>
          </Table>
        </Flex>
      </Flex>
    </>
  );
};

export default UnscheduledContentPage;
