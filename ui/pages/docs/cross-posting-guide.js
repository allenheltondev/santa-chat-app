import { Card, Flex, Heading, Text } from "@aws-amplify/ui-react";
import { IoArrowBack } from 'react-icons/io5';
import { useRouter } from 'next/router';

const CrossPostingGuidePage = () => {
  const router = useRouter();
  return (
    <Flex direction="column" justifyContent="center" alignItems="center" width="100%">
      <Flex direction="column" gap="1em" width={{ base: "95%", large: "80%" }}>
        <Card variation="elevated">
          <Flex direction="row" gap="1em" alignItems="center">
            <IoArrowBack size="1.5em" color="black" cursor="pointer" onClick={() => router.back()} />
            <Heading level={4}>Cross-Posting Guidelines for Content Creators</Heading>
          </Flex>
        </Card>
        <Card variation="elevated" >
          <Text>These guidelines ensurewe not only magnify our content's reach but also contribute value to the broader tech community while solidifying Momento's respected standing.</Text>
          <ol>
            <li>
              <strong>What is eligible for cross-posting?</strong>
              <ul>
                <li><strong>Acceptable topics</strong>
                  <ul>
                    <li>Project Showcase: Detail projects you've built, emphasizing technical challenges, learnings, and innovations.</li>
                    <li>Academic Articles: Share scholarly pieces focused on technical principles, research findings, or in-depth explorations of specific technologies.</li>
                    <li>Speculative Pieces: Offer thoughts on future technologies, industry trends, or emerging best practices.</li>
                  </ul>
                </li>
                <li><strong>Unsuitable topics</strong>
                  <ul>
                    <li>Primarily advertise or promote Momento's services.</li>
                    <li>Do not align with the educational or thought-leadership tone of platforms like dev.to and medium.com.</li>
                  </ul>
                </li>
              </ul>
            </li>

            <li>
              <strong>Content Integrity</strong>
              <ul>
                <li>When drawing upon or referencing other work, be sure the appropriate credits and links are provided.</li>
                <li>Make sure your claims are supported with research, evidence, or personal experience.</li>
              </ul>
            </li>

            <li>
              <strong>Branding and Promotion</strong>
              <ul>
                <li>Mention your affiliation with Momento in your author bio or when it's contextually relevant, but without overt promotion.</li>
                <li>While discussing tools or services, including Momento's, provide an unbiased description, steering clear of promotional language.</li>
              </ul>
            </li>

            <li>
              <strong>Backlinks</strong>
              <ul>
                <li>Incorporate backlinks to other relevant content from Momento where appropriate. These internal links not only drive traffic but also enhance the interconnectedness of our content ecosystem, adding value for readers and boosting our content's SEO value.</li>
              </ul>
            </li>

            <li>
              <strong>Canonical Links</strong>
              <ul>
                <li>Ensure that the canonical link is set to point to the original article hosted on Momento's site, signaling search engines to recognize Momento's website as the original content source.</li>
                <li>If your post will originiate on an external site, canonical links are not necessary.</li>
              </ul>
            </li>

            <li>
              <strong>Engagement and Interaction</strong>
              <ul>
                <li>Stay active in monitoring and engaging with comments. Address questions constructively, thank readers for their input, and nurture a sense of community.</li>
                <li>Always maintain professionalism, especially when navigating criticism or diverse opinions.</li>
              </ul>
            </li>

            <li>
              <strong>Publication Guidelines</strong>
              <ul>
                <li>When posting on platforms like dev.to or Medium, ensure the articles are added to Momento's official publication on each respective platform. This centralizes our content and provides a unified front for our brand.</li>
              </ul>
            </li>

          </ol>

        </Card>
      </Flex>
    </Flex>
  )
}
export default CrossPostingGuidePage;
