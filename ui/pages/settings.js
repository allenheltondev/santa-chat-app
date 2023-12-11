import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Flex, Card, Heading, Text, Link, Table, TableHead, TableRow, TableCell, TableBody, Loader, View, Authenticator } from '@aws-amplify/ui-react';
import Head from 'next/head';
import { API, Auth } from 'aws-amplify';

const SettingsPage = () => {

  return (
    <Authenticator variation="modal">
      <Head>
        <title>Settings | Justin's Christmas Gift</title>
      </Head>
      <Flex direction="column" width="100%" alignItems="center" height="90vh">

      </Flex>
    </Authenticator>
  );
};

export default SettingsPage;
