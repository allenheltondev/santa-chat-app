import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Card, Flex, Heading } from '@aws-amplify/ui-react';
import Head from 'next/head';
import { Auth } from 'aws-amplify';
import SocialPostsTracker from '../../components/SocialPostsTracker';

const SocialPostsPage = () => {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    const loadContent = async () => {
      const session = await Auth.currentSession();
      const jwt = session.getIdToken().getJwtToken();
      setToken(jwt);
      let date = router.query.startDate;
      if (!date) {
        date = new Date().toISOString().split('T')[0];
      }
      setStartDate(date);

      let rangeEndDate = router.query.endDate;
      if (!rangeEndDate) {
        rangeEndDate = new Date(new Date(`${date}T23:59:59Z`).setDate(new Date(`${date}T23:59:59Z`).getDate() + 7)).toISOString().split('T')[0];
      }
      setEndDate(rangeEndDate)
0    }

    loadContent();
  }, []);

  return (
    <>
      <Head>
        <title>Momento Content Schedule</title>
      </Head>
      <Flex direction="column" width="100%" alignItems="center">
        <Flex direction="column" width="90%">
          <Card variation="elevated" width="100%">
            <Flex direction="row" alignItems="center">
              <Heading level={4}>Upcoming social media posts from</Heading>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <Heading level={4}>to</Heading>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Flex>
          </Card>
          <SocialPostsTracker token={token} startDate={startDate} endDate={endDate} />
        </Flex>
      </Flex>
    </>
  );
};

export default SocialPostsPage;
