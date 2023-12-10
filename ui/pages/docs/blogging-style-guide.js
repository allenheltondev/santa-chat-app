import { Card, Flex, Heading, Text, Link } from "@aws-amplify/ui-react";
import { IoArrowBack } from 'react-icons/io5';
import { useRouter } from 'next/router';

const BlogStyleGuidePage = () => {
  const router = useRouter();
  return (
    <Flex direction="column" justifyContent="center" alignItems="center" width="100%">
      <Flex direction="column" gap="1em" width={{ base: "95%", large: "80%" }}>
        <Card variation="elevated">
          <Flex direction="row" gap="1em" alignItems="center">
            <IoArrowBack size="1.5em" color="black" cursor="pointer" onClick={() => router.back()} />
            <Heading level={4}>Blogging Style Guide</Heading>
          </Flex>
        </Card>
        <Card variation="elevated" >
          <Text>Explore in detail the tone, style, and other critical elements that every Momento blog post should encompass.</Text>
          <ol>
            <li>
              <strong>Storytelling</strong>
              <ul>
                <li>Every blog post should weave a narrative that captivates the reader.</li>
                <li>Using real-world examples, relatable experiences, and a hint of vulnerability makes the content more engaging and memorable.</li>
                <li>Driving emotion makes your call to action stronger.</li>
              </ul>
            </li>
            <li>
              <strong>Tone of voice</strong>
              <ul>
                <li><strong>Embrace these tones</strong>
                  <ul>
                    <li>Positive: Maintain an optimistic view, focusing on the beneficial aspects.</li>
                    <li>Lighthearted: Keep the mood upbeat, even when addressing complex subjects.</li>
                    <li>Straightforward: Ensure readers grasp your message with ease.</li>
                    <li>Earnest: Be sincere and straightforward.</li>
                    <li>Thankful: Always express gratitude.</li>
                  </ul>
                </li>
                <li><strong>Steer clear of these</strong>
                  <ul>
                    <li>Negative: Approach challenges with a solution-oriented mindset.</li>
                    <li>Disparaging: Ensure criticism is constructive.</li>
                    <li>Combative: Engage gracefully with differing views.</li>
                    <li>Snarky: To prevent misunderstandings, avoid sarcasm.</li>
                    <li>Attacking: Educate and inspire, not target or belittle.</li>
                  </ul>
                </li>
              </ul>
            </li>
            <li>
              <strong>Relevance and emotional triggers</strong>
              <ul>
                <li>Without emotion, there's no action.</li>
                <li>Find emotional triggers in your writing to bolster the call to action.</li>
                <li>Ensure your content is relevant to readers.</li>
              </ul>
            </li>
            <li>
              <strong>Clarity in communication</strong>
              <ul>
                <li>Short Sentences: Aim for concise sentences.</li>
                <li><Link href="https://www.grammarly.com/blog/active-vs-passive-voice/">Active Voice</Link>: Use the active voice for a lively and confident tone.</li>
                <li>Simple Words: Avoid jargon and opt for simple words.</li>
                <li>Subheadings: Structure your content with relevant subheadings.</li>
                <li>Real-world Examples: Use examples to illustrate your points.</li>
              </ul>
            </li>
            <li>
              <strong>Craft a Strong Call to Action (CTA)</strong>
              <ul>
                <li>Relevance: Ensure your CTA aligns with the content's context and the readers' needs.</li>
                <li>Urgency: Create a sense of importance to encourage immediate action.</li>
                <li>Clarity: Be concise and clear about what you're asking the reader to do.</li>
                <li>Emotion: Without emotion, there's no action. Tap into emotional triggers to make the CTA resonate with readers.</li>
                <li>Visibility: Place your CTA strategically within your content, ensuring it's easily noticeable.</li>
              </ul>
            </li>
          </ol>
        </Card>
      </Flex>
    </Flex>
  )
};

export default BlogStyleGuidePage;
