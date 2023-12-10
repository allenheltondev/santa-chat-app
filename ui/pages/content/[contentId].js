import { Flex, Card, Heading, Link } from "@aws-amplify/ui-react";
import { useRouter } from 'next/router';
import { useEffect, useState, useContext } from "react";
import Head from "next/head";
import { IoArrowBack } from 'react-icons/io5';
import { getStatusBadge } from "../../utils/utils";
import ContentForm from "../../components/ContentForm";
import SocialPostsTracker from "../../components/SocialPostsTracker";
import CopyTracker from "../../components/CopyTracker";
import { AiOutlineForm } from 'react-icons/ai';
import { TiSocialTwitter } from 'react-icons/ti';
import { RxOpenInNewWindow } from 'react-icons/rx';
import { CiGlobe } from 'react-icons/ci';
import { getContentMetadata, getContentCopies } from "../../services/ContentService";
import TokenContext from "../../services/TokenContext";

const CONTENT_PAGES = {
  metadata: 'metadata',
  social: 'social',
  copy: 'copies'
};

const ContentPage = () => {
  const router = useRouter();
  let { token, refreshToken } = useContext(TokenContext);
  const [content, setContent] = useState({});
  const [activePanel, setActivePanel] = useState(CONTENT_PAGES.metadata);
  const [viewLink, setViewLink] = useState(null);

  useEffect(() => {
    const loadDetail = async (contentId) => {
      try {
        const response = await getContentMetadata(token, contentId);
        setContent(response);
        if (router.query.display) {
          swapPanel(router.query.display);
        }
      } catch (err) {
        console.error(err);
        router.push('/content');
      }
    };

    if (router.query.contentId) {
      loadDetail(router.query.contentId);
    }
  }, [router.query.contentId]);

  useEffect(() => {
    const displayViewIcon = async (token, contentId) => {
      const copies = await getContentCopies(token, contentId);
      if (content?.status == 'Completed') {
        const links = copies.filter(c => c.type == 'Live Version');
        if (links.length) {
          let link;
          // Favor Momento's site. Use the first one otherwise
          if (links.length > 1) {
            link = links.find(l => l.url.includes('gomomento.com'));
          }

          if (!link) {
            link = links[0];
          }
          setViewLink(link.url);
        }
      } else {
        const draft = copies.find(c => c.type == 'Draft');
        if (draft) {
          setViewLink(draft.url);
        }
      }
    };

    if (content?.id && token) {
      displayViewIcon(token, content.id);
    }
  }, [content]);


  const getActivePanel = () => {
    switch (activePanel) {
      case CONTENT_PAGES.social:
        return <SocialPostsTracker contentId={router.query.contentId} token={token} />;
      case CONTENT_PAGES.copy:
        return <CopyTracker contentId={router.query.contentId} token={token} />;
      default:
        return <ContentForm content={content} token={token} setContent={setContent} isNewContent={false} />;
    }
  };

  const swapPanel = (panelName) => {
    const newUrl = {
      pathname: router.pathname,
      query: { ...router.query, display: panelName },
    };
    router.replace(newUrl, undefined, { shallow: true });
    setActivePanel(panelName);
  };

  return (
    <>
      <Head>
        <title>Edit Details | Momento Content</title>
      </Head>
      <Flex direction="row" gap="1em" paddingRight="1em" height="90vh" alignItems="stretch">
        <Flex direction="column" width="4em" height="auto" alignItems="stretch">
          <Card variation="outlined" height="100%">
            <Flex direction="column" gap="1em">
              <AiOutlineForm size="1.5em" style={{ cursor: "pointer" }} onClick={() => swapPanel(CONTENT_PAGES.metadata)} />
              <CiGlobe size="1.5em" style={{ cursor: "pointer" }} onClick={() => swapPanel(CONTENT_PAGES.copy)} />
              <TiSocialTwitter size="1.75em" style={{ cursor: "pointer" }} onClick={() => swapPanel(CONTENT_PAGES.social)} />
            </Flex>
          </Card>
        </Flex>
        <Flex direction="column" width="100%" >
          <Card variation="elevated" width="100%">
            <Flex direction="row" alignItems="center" justifyContent="space-between">
              <Flex direction="row" gap="1em" alignItems="center">
                <IoArrowBack size="1.5em" color="black" cursor="pointer" onClick={() => router.back()} />
                <Heading level={4}>{content.title}</Heading>
                {viewLink && (
                  <Link href={viewLink} target="_blank">
                    <Flex justifyContent="center">
                      <RxOpenInNewWindow color="black" />
                    </Flex>
                  </Link>
                )}
              </Flex>
              {getStatusBadge(content.status)}
            </Flex>
          </Card>
          <Flex flex={1}>
            {getActivePanel()}
          </Flex>
        </Flex>
      </Flex>

    </>
  );
};

export default ContentPage;
