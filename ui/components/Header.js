import React, { useEffect, useState } from 'react';
import { Flex, Image, Button, Heading } from '@aws-amplify/ui-react';
import { useRouter } from 'next/router';
import { Menu, Item, useContextMenu, Separator } from 'react-contexify';
import { Auth } from 'aws-amplify';

const PROFILE = 'profilemenu';

const Header = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const { show } = useContextMenu({ id: PROFILE });

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await Auth.currentAuthenticatedUser();
        setUsername(user.attributes.email);
      } catch (err) {
        console.error(err);
      }
    };

    getUser();
  }, []);

  const handleContextMenu = (event) => {
    event.stopPropagation();
    show({ event });
  };

  return (
    <>
      <Flex direction="row" justifyContent="space-between" alignContent="center" padding="10px" backgroundColor="#FFFFFF" boxShadow="medium">
        <Flex direction="row" alignItems="center" gap=".75em" style={{ cursor: "pointer" }} onClick={() => router.push('/')} >
          <Image src="/logo.png" maxHeight="2em" />
          <Heading level={5} marginTop=".2em">Justin's Christmas Gift</Heading>
        </Flex>
        <Flex direction="row" gap="1.25em" alignItems="center">
          {username ? (
            <Flex
              alignItems="center"
              justifyContent="center"
              borderRadius="xxl"
              backgroundColor="#B3E5FC"
              width="2em"
              height="2em"
              onClick={handleContextMenu}>
              {username?.charAt(0).toUpperCase()}
            </Flex>
          ) : (
            <Button onClick={() => router.push('/settings')}>Sign In</Button>
          )}
        </Flex>
        <Menu id={PROFILE}>
          <Item id="settings" onClick={(() => router.push('/settings'))}>Settings</Item>
          <Separator />
          <Item id="signOut" onClick={() => Auth.signOut()}>Sign Out</Item>
        </Menu>
      </Flex>
    </>
  );
};

export default Header;
