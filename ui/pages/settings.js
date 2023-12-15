import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Flex, Card, Heading, Table, TableHead, TableRow, TableCell, TableBody, View, Authenticator } from '@aws-amplify/ui-react';
import Head from 'next/head';
import { API, Auth } from 'aws-amplify';
import { IoMdAddCircleOutline } from "react-icons/io";
import { GrPowerReset } from "react-icons/gr";
import AddProfile from '../components/AddProfile';
import { toast } from 'react-toastify';

const SettingsPage = () => {
  const router = useRouter();
  const [profiles, setProfiles] = useState([]);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [token, setToken] = useState();

  useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then(async (user) => {
        if (user) {
          const session = await Auth.currentSession();
          const jwt = session.getIdToken().getJwtToken();
          getProfiles(jwt);
          setToken(jwt);
        }
      })
      .catch(err => console.log(err));

    if (router.query.message) {
      const message = decodeURIComponent(router.query.message);
      if (router.query?.messageType?.toLowerCase() == 'success') {
        toast.success(message, { position: 'top-right', autoClose: 5000, draggable: false, hideProgressBar: true, theme: 'colored' });
      } else {
        toast.error(message, { position: 'top-right', autoClose: 5000, draggable: false, hideProgressBar: true, theme: 'colored' });
      }
      router.replace('/settings', undefined, { shallow: true });
    }
  }, []);

  const getProfiles = async (jwt) => {
    const response = await API.get('Admin', '/profiles', {
      headers: {
        Authorization: `Bearer ${jwt ?? token}`
      }
    });
    setProfiles(response.profiles);
  };

  const onClose = (passcode) => {
    setShowAddProfile(false);
    if (passcode) {
      router.push(`/profiles/${passcode}`);
    }
  };

  const reset = async (event, passcode) => {
    event.preventDefault();
    event.stopPropagation();
    await API.del('Admin', `/profiles/${passcode}/sessions`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    getProfiles();
  };

  return (
    <Authenticator variation="modal">
      {({ signOut, user }) => (
        <>
          <Head>
            <title>Settings | Justin's Christmas Gift</title>
          </Head>
          <Flex direction="column" width="100%" alignItems="center" height="90vh">
            <Card variation="elevated" width={{ base: '90%', large: '60%' }}>
              <Heading level={5}>Hey {user.attributes.email}!</Heading>
            </Card>
            <Card variation="elevated" width={{ base: '90%', large: '60%' }}>
              <Flex direction="row" justifyContent="space-between" alignItems="center" marginBottom="1em">
                <Heading level={4}>User profiles</Heading>
                <View style={{ cursor: "pointer" }} onClick={() => setShowAddProfile(true)}>
                  <IoMdAddCircleOutline size="2em" />
                </View>
              </Flex>
              <Table highlightOnHover={true}>
                <TableHead>
                  <TableRow>
                    <TableCell as="th">Name</TableCell>
                    <TableCell as="th">Passcode</TableCell>
                    <TableCell as="th" textAlign="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {profiles.map(profile => (
                    <TableRow key={profile.passcode} >
                      <TableCell onClick={() => router.push(`/profiles/${profile.passcode}`)}>{profile.name}</TableCell>
                      <TableCell>{profile.passcode}</TableCell>
                      <TableCell onClick={() => router.push(`/profiles/${profile.passcode}`)}>
                        <Flex direction="row" gap="1em" alignItems="center" justifyContent="right">
                          {profile.status}
                          <View style={{ cursor: 'pointer' }} onClick={(e) => reset(e, profile.passcode)}>
                            <GrPowerReset />
                          </View>
                        </Flex>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </Flex>
          {showAddProfile && (
            <AddProfile onClose={onClose} token={token} />
          )}
        </>
      )}
    </Authenticator>
  );
};

export default SettingsPage;
