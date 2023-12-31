import { useRouter } from 'next/router';
import { useState, useContext } from 'react';
import { Flex, Card, Heading, TextField, Text, Loader, Image } from '@aws-amplify/ui-react';
import Head from 'next/head';
import MomentoContext from '../services/MomentoContext';

const Home = () => {
	const { initialize } = useContext(MomentoContext);
	const router = useRouter();
	const [passcode, setPasscode] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const handleKeyDown = async (event) => {
		if (event.key == 'Enter') {
			setIsLoading(true);
			const response = await fetch('https://api.justinschristmasgift.com/sessions', {
				method: 'POST',
				body: JSON.stringify({ passcode })
			});

			if (!response.ok) {
				setError("That wasn't right. Can you try again?");
			} else {
				setError('');
				const data = await response.json();
				sessionStorage?.setItem('name', data.name);
				await initialize(data.token, data.exp);
				router.push(`/chat/${passcode}`);
			}

			setIsLoading(false);
		}
	};

	return (
		<>
			<Head>
				<title>Justin's Christmas Gift</title>
			</Head>
			<Flex direction="column" width="100%" alignItems="center" height="90vh" justifyContent="normal">
				<Image src='/santa.png' width={{ base: "50%", large: "25%" }} marginBottom="1.5em" marginTop={{base: '1.5em', large: '0em'}}/>
				<Card variation="elevated" width={{ base: '90%', large: '60%' }} padding="20px 30px 30px 30px">
					<Flex direction="column" justifyContent="center">
						<Heading level={4}>Did Santa give you a code?</Heading>
						{!isLoading ? (
							<>
								<TextField placeholder="Enter the code and press enter" value={passcode} onChange={(e) => setPasscode(e.target.value?.toUpperCase())} onKeyDown={handleKeyDown} />
								{error && <Text color="red.60" fontSize="14px" fontStyle="italic">{error}</Text>}</>
						) : (
							<Flex width="100%" alignItems="center" justifyContent="center">
								<Loader />
							</Flex>
						)}

					</Flex>
				</Card>
			</Flex>
		</>
	);
};

export default Home;
