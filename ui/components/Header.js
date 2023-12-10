import React, { useEffect, useState } from 'react';
import { Flex, Image, Button } from '@aws-amplify/ui-react';
import { useRouter } from 'next/router';
import { Menu, Item, useContextMenu } from 'react-contexify'
import { Auth } from 'aws-amplify';
import { BiCalendarCheck } from 'react-icons/bi';
import { FiList } from 'react-icons/fi';
import { TiSocialTwitter } from 'react-icons/ti';

const PROFILE = 'profilemenu';

const Header = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const { show } = useContextMenu({ id: PROFILE });

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await Auth.currentAuthenticatedUser();
        setUsername(user.attributes.email)
      } catch (err) {
        console.error(err);
      }
    }

    getUser();
  }, []);

  const handleContextMenu = (event) => {
    event.stopPropagation();
    show({ event });
  };

  return (
    <>
      <Flex direction="row" justifyContent="space-between" alignContent="center" padding="10px" backgroundColor="#25392B" boxShadow="medium">
        <Image src="/logo.png" maxHeight="2em" style={{ cursor: "pointer" }} onClick={() => router.push('/')} />
        <Flex direction="row" gap="1.25em" alignItems="center">
          <TiSocialTwitter size="1.25em" cursor="pointer" color="white" onClick={() => router.push('/social')} />
          <FiList size="1.25em" cursor="pointer" color="white" onClick={() => router.push('/content/unscheduled')} />
          <BiCalendarCheck size="1.25em" cursor="pointer" color="white" onClick={() => router.push('/schedule')}/>
          <Button color="white" borderColor="white" height="2.25em" fontSize=".9rem" colorTheme="overlay" onClick={() => router.push('/content')}>+ New Idea</Button>
          <Flex
            alignItems="center"
            justifyContent="center"
            borderRadius="xxl"
            backgroundColor="#C4F135"
            width="1.5em"
            height="1.5em"
            onClick={handleContextMenu}>
            {username?.charAt(0).toUpperCase()}
          </Flex>
        </Flex>
        <Menu id={PROFILE}>
          <Item id="signOut" onClick={() => Auth.signOut()}>Sign Out</Item>
        </Menu>
      </Flex>
    </>
  );
};

export default Header;
