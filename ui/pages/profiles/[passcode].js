import React, { useEffect, useState } from 'react';
import { Flex, Card, Heading, Button, TextField, TextAreaField, View, Authenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/router';
import { API, Auth } from 'aws-amplify';
import { IoArrowBack } from "react-icons/io5";
import Head from 'next/head';
import { toast } from 'react-toastify';

const EditProfilePage = () => {
  const router = useRouter();
  const { passcode } = router.query;
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    gender: '',
    facts: [],
    presents: []
  });
  const [token, setToken] = useState();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (passcode) {
      Auth.currentAuthenticatedUser()
        .then(async (user) => {
          if (user) {
            const session = await Auth.currentSession();
            const jwt = session.getIdToken().getJwtToken();
            getProfile(jwt);
            setToken(jwt);
          }
        })
        .catch(err => console.log(err));
    }
  }, [passcode]);

  const getProfile = async (jwt) => {
    try {
      const response = await API.get('Admin', `/profiles/${passcode}`, {
        headers: {
          Authorization: `Bearer ${jwt ?? token}`
        }
      });
      setProfile(response);

    } catch (err) {
      router.push('/settings?message=Could%20not%20find%20profile');
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      console.log('here')
      setIsSaving(true);
      await API.put('Admin', `/profiles/${passcode}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: {
          name: profile.name,
          age: Number(profile.age),
          gender: profile.gender,
          facts: profile.facts.filter(f => f.trim()).map(f => f.trim()),
          presents: profile.presents.filter(p => p.description.trim()),
          status: profile.status
        }
      });

      router.push('/settings?message=Profile%20saved%20successfully&messageType=success');
    } catch (err) {
      toast.error('Something went wrong. Please try again', { position: 'top-right', autoClose: 5000, draggable: false, hideProgressBar: true, theme: 'colored' });
    }
    finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newProfile = {
      ...profile,
      [name]: value
    };
    setProfile(newProfile);
  };

  const handleFactsChange = (e) => {
    const { value } = e.target;
    const facts = value.split('\n');
    setProfile({ ...profile, facts });
  };

  const handlePresentsChange = (e) => {
    const { value } = e.target;
    const presents = value.split('\n').map((p, index) => {
      return {
        order: index + 1,
        description: p
      };
    });
    setProfile({ ...profile, presents });
  };

  return (
    <Authenticator variation="modal">
      <View>
        <Head>
          <title>Edit Profile | Justin's Christmas Gift</title>
        </Head>
        <Flex direction="column" width="100%" alignItems="center">
          <Card variation="elevated" width={{ base: '90%', large: '60%' }}>
            <Flex direction="row" gap="1em" alignItems="center">
              <View style={{ cursor: 'pointer' }} onClick={() => router.push('/settings')}>
                <IoArrowBack size="1.5em" />
              </View>
              <Heading level={4}>Update {profile.name}'s profile</Heading>
            </Flex>
          </Card>
          <Card variation="elevated" width={{ base: '90%', large: '60%' }}>
            <Flex direction="column" justifyContent="space-between" height="100%">
              <Flex direction="column" gap=".5em" paddingLeft="1em" paddingRight="1em" paddingBottom="1em">
                <form id="profile_form" onSubmit={updateProfile}>
                  <TextField label={<b>Name</b>} value={profile.name} name="name" required onChange={handleInputChange} marginBottom=".5em" />
                  <TextField label={<b>Age</b>} value={profile.age} name="age" required type="number" onChange={handleInputChange} marginBottom=".5em" />
                  <label htmlFor="gender_field"><b>Gender</b></label>
                  <select id="gender_field" name="gender" required value={profile.gender} onChange={handleInputChange} style={{ padding: ".5em", width: "100%", marginTop: ".5em", marginBottom: ".5em" }}>
                    <option key="female" value="female">Female</option>
                    <option key="male" value="male">Male</option>
                    <option key="other" value="other">Other</option>
                  </select>
                  <TextAreaField resize="vertical" label={<b>Facts</b>} descriptiveText="List some facts about this person that Santa can use to verify it's them. Each fact should be on its own line." value={profile.facts?.join('\n')} required onChange={handleFactsChange} marginBottom=".5em" />
                  <TextAreaField resize="vertical" label={<b>Presents</b>} descriptiveText="Describe the presents in the order they should be opened. Each line should represent a new present." value={profile.presents?.map(p => p.description).join('\n')} required onChange={handlePresentsChange} marginBottom=".5em" />
                </form>
              </Flex>
              <Flex direction="row" justifyContent="right">
                <Flex direction="row" alignItems="center" justifyContent="flex-end" paddingLeft="1em" paddingRight="1em" >
                  <Button onClick={() => router.push('/settings')}>Cancel</Button>
                  <Button variation="primary" isLoading={isSaving} type="submit" form="profile_form" >Save</Button>
                </Flex>
              </Flex>
            </Flex>
          </Card>
        </Flex>
      </View>
    </Authenticator>
  );
};

export default EditProfilePage;
