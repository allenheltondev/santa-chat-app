import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Flex, Card, Heading, Text, Link, Table, TableHead, TableRow, TableCell, TableBody, Loader, View } from '@aws-amplify/ui-react';
import Head from 'next/head';
import { API, Auth } from 'aws-amplify';

const Home = () => {
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
				<title>Justin's Christmas Gift</title>
			</Head>
			<Flex direction="column" width="100%" alignItems="center" height="90vh">

			</Flex>
		</>
	);
};

export default Home;
