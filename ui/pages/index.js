import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Flex, Card, Heading, Text, Link, Table, TableHead, TableRow, TableCell, TableBody, Loader, View } from '@aws-amplify/ui-react';
import Head from 'next/head';
import { API, Auth } from 'aws-amplify';
import { getFirstDayOfMonth } from '../utils/utils';
import { MdRefresh } from 'react-icons/md';
import ContentRow from '../components/ContentRow';

const Home = () => {
	const [upcomingContent, setUpcomingContent] = useState([]);
	const [isFetching, setIsFetching] = useState(false);
	const [token, setToken] = useState(null);
	const [userEmail, setUserEmail] = useState(null);

	useEffect(() => {
		const getSessionToken = async () => {
			const session = await Auth.currentSession();
			const jwt = session.getIdToken().getJwtToken();
			setToken(jwt);
		}

		getSessionToken();
	}, []);

	useEffect(() => {
		if (token) {
			refresh();
		}
	}, [token]);

	const refresh = async () => {
		setIsFetching(true);
		try {
			if (!token) {
				const session = await Auth.currentSession();
				token = session.getIdToken().getJwtToken();
			}

			const startDate = getFirstDayOfMonth();
			const response = await API.get('ContentApi', `/ranges/${startDate}?limit=5`, { headers: { Authorization: `Bearer ${token}` } })
			setUpcomingContent(response.content);
		} catch (err) {
			console.error(err);
		} finally {
			setIsFetching(false);
		}
	};

	const loadLoggedInUser = async () => {
		if(!userEmail){
		const user = await Auth.currentUserInfo()
		setUserEmail(user.attributes.email);
		}
	}

	loadLoggedInUser();

	return (
		<>
			<Head>
				<title>Momento Content Planning</title>
			</Head>
			<Flex direction="column" width="100%" alignItems="center" height="90vh">
				<Card variation="elevated" borderRadius="large" padding="1.5em 3em" maxWidth="60%" marginTop="1em">
					<Flex direction="column" gap="1em" wrap="wrap" textAlign="center">
						<Heading level={4}>Have an idea?</Heading>
						<Text>Looking to submit an idea for a piece of content? You're in the right place. Head over to <Link href="/content">the intake form</Link> to submit your idea.</Text>
						<Text>Thanks in advance! Your input is greatly appreciated 😊</Text>
					</Flex>
				</Card>
				<Flex direction="column" width="90%">
					<Card variation="elevated" textAlign="center" width="100%" padding="small">
						<Flex direction="row" justifyContent="center">
							<Heading level={3}>Upcoming Content</Heading>
						</Flex>
					</Card>
					<Table highlightOnHover="true" backgroundColor="white" boxShadow="medium" size="small">
						<TableHead >
							<TableRow backgroundColor="#25392B">
								<TableCell as="th" fontSize="large" color="white">Type</TableCell>
								<TableCell as="th" fontSize="large" color="white">Title</TableCell>
								<TableCell as="th" fontSize="large" color="white">Scheduled Date</TableCell>
								<TableCell as="th" > {isFetching ? <Loader size="2em" /> : <MdRefresh size="2em" cursor="pointer" color="white" onClick={refresh} />}</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{upcomingContent?.map((post) => (
								<ContentRow content={post} jwt={token} refresh={refresh} key={post.id} showSummary={true} user={userEmail}/>
							))}
						</TableBody>
					</Table>
				</Flex>
			</Flex>
		</>
	);
};

export default Home;
