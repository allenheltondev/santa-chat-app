import React, { useEffect, useState, useRef, useContext } from 'react';
import { Flex, Card, Heading, Button, Text, Link, Table, TableHead, TableRow, TableCell, TableBody, Loader, View, Authenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const EditProfilePage = () => {
  const router = useRouter();
  const { passcode } = router.query;
  const [profile, setProfile] = useState({});


  return (
    <Authenticator variation="modal">
      <View>
        <Head>
          <title>Edit Profile | Justin's Christmas Gift</title>
        </Head>

      </View>
    </Authenticator>
  );
};

export default EditProfilePage;
