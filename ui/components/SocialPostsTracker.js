import { useState, useEffect } from 'react';
import { Flex, Card, Text, Button, Badge, Heading, Expander, ExpanderItem, TextField, CheckboxField } from "@aws-amplify/ui-react";
import { API } from 'aws-amplify';
import { toast } from 'react-toastify';
import { IoMdAddCircle } from 'react-icons/io';
import { RxOpenInNewWindow } from 'react-icons/rx';
import { Link } from 'aws-amplify-react';

const SocialPostsTracker = ({ contentId, token, startDate, endDate }) => {
  const [posts, setPosts] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [allContent, setAllContent] = useState([]);
  const contentList = [];

  useEffect(() => {
    if (token) {
      fetchPosts();
    }
  }, [token, contentId, startDate, endDate]);

  useEffect(() => {
    if (!contentId && !isLoaded) {
      enrichPostTitles();
    } else {
      setIsLoaded(true);
    }
  }, [posts]);

  const enrichPostTitles = async () => {
    const enrichedPosts = [...posts];
    for (const post of enrichedPosts) {
      if (!post.title) {
        const content = contentList.find(c => c.id === post.contentId);
        if (!content) {
          const response = await API.get('ContentApi', `/${post.contentId}`, { headers: { Authorization: `Bearer ${token}` } });
          contentList.push({ id: post.contentId, title: response.title });
          post.title = response.title;
        } else {
          post.title = content.title;
        }
      }
    }
    setIsLoaded(true);
    setPosts(enrichedPosts);
  };

  const fetchPosts = async () => {
    try {
      if (contentId) {
        const response = await API.get('ContentApi', `/${contentId}/social-posts`, { headers: { Authorization: `Bearer ${token}` } });
        setPosts(response.posts);
      } else if (startDate && endDate) {
        setIsLoaded(false);
        let response = await API.get('ContentApi', `/social-posts?startDate=${startDate}&endDate=${endDate}T23:59:59`, { headers: { Authorization: `Bearer ${token}` } });
        setPosts(response.posts);

        const contentStartDate = getSevenDaysPrior(startDate);
        response = await API.get('ContentApi', `/ranges/${contentStartDate}?endDate=${endDate}&showCompleted=true`, { headers: { Authorization: `Bearer ${token}` } })
        const contentCatalog = response.content.map(c => {
          return {
            id: c.id,
            title: c.title
          }
        });
        contentCatalog.sort((a, b) => a.title.localeCompare(b.title));
        setAllContent(contentCatalog)
      }

    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error('Error loading tracked social post', { position: 'top-right', autoClose: 10000, draggable: false, hideProgressBar: true, theme: 'colored' });
    }
  };

  const handleDelete = async (index, event) => {
    event.preventDefault();
    const socialPost = posts[index];
    await API.del('ContentApi', `/${contentId ?? socialPost.contentId}/social-posts/${socialPost.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    const newPosts = [...posts];
    newPosts.splice(index, 1);
    setPosts(newPosts);
  };

  const savePost = async (index, event) => {
    event.preventDefault();

    const post = posts[index];
    if(post.scheduledDate){
      post.scheduledDate = formatDate(new Date(post.scheduledDate));
    }
    if(post.autoSchedule){
      delete post.scheduledDate;
    }
    const params = {
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: { ...post }
    };

    delete params.body.contentId;

    if (!post.id) {
      const response = await API.post('ContentApi', `/${contentId ?? post.contentId}/social-posts`, params);
      updateSocialPost(index, { target: { name: 'id', value: response.id } });
      toast.success('Post added!', { position: 'top-right', autoClose: 10000, draggable: false, hideProgressBar: true, theme: 'colored' });
    } else {
      await API.patch('ContentApi', `/${contentId ?? post.contentId}/social-posts/${post.id}`, params);
      toast.success('Updated successfully', { position: 'top-right', autoClose: 10000, draggable: false, hideProgressBar: true, theme: 'colored' });
    }
  }

  const updateSocialPost = async (index, event) => {
    const { name, value } = event.target;
    const updatedPosts = [...posts];
    updatedPosts[index] = {
      ...updatedPosts[index],
      [name]: value,
    };
    setPosts(updatedPosts);
  };

  const handleBooleanChange = (index, e) => {
    const { name } = e.target;
    const updatedPosts = [...posts];
    updatedPosts[index] = {
      ...updatedPosts[index],
      [name]: e.target.checked,
    };
    setPosts(updatedPosts);
  };

  const formatDate = (date) => {
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const min = String(date.getUTCMinutes()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;
  }

  const getSevenDaysPrior = (dt) => {
    const date = new Date(`${dt}T23:59:59`);
    date.setDate(date.getDate() - 7);

    const formattedDate = date.toISOString().split('T')[0];

    return formattedDate;
  };

  const handleMessageUpdate = (index, message) => {
    const updatedPosts = [...posts];
    updatedPosts[index] = {
      ...updatedPosts[index],
      message,
      messageLength: countCharacters(message)
    };

    setPosts(updatedPosts);
  };

  const countCharacters = (input) => {
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = input.match(urlRegex) || [];
    const urlChars = urls.length * 23;
    const nonUrlChars = Array.from(input.replace(urlRegex, '')).reduce((count, char) => {
      return count + (char.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/) ? 2 : 1);
    }, 0);

    return urlChars + nonUrlChars;
  };

  return (
    <Card variation="outlined" width='100%' height="auto">
      <Flex direction="row" justifyContent="space-between" marginBottom="1em">
        <Heading level={5}>Social Posts</Heading>
        <IoMdAddCircle size="2em" style={{ cursor: "pointer" }} onClick={() => setPosts([...posts, { type: 'twitter' }])} />
      </Flex>
      <Expander type="single" isCollapsible={true}>
        {posts.map((post, index) => (
          <ExpanderItem key={`post-${index}`} value={`post-${index}`} title={<CustomTitle type={post.type} handle={post.handle} message={post.message} scheduledDate={post.scheduledDate} />}>
            <form onSubmit={(e) => savePost(index, e)}>
              <Flex direction="column" gap=".5em" >
                {(post.id && post.contentId) && (
                  <Link href={`/content/${post.contentId}`} target="_blank">
                    <Flex direction="row" gap=".5em" alignItems="center">
                      <Heading level={6}>{post.title ?? 'View Content'}</Heading>
                      <RxOpenInNewWindow color="black" />
                    </Flex></Link>
                )}
                {(!post.id && !contentId) && (
                  <>
                    <label>Select Content:</label>
                    <select value={post.contentId} name="contentId" required onChange={(e) => updateSocialPost(index, e)}>
                      {allContent.map(ac => (
                        <option value={ac.id} key={ac.id}>{ac.title}</option>
                      ))}
                    </select>
                  </>
                )}
                <label>Type</label>
                <select value={post.type} name="type" required onChange={(e) => updateSocialPost(index, e)}>
                  <option value="twitter">Twitter</option>
                  <option value="linkedIn">LinkedIn</option>
                </select>
                <TextField label="Handle" descriptiveText="When set to the Momento handle (@momentohq), you get the choice to let AI auto-schedule" value={post.handle} name="handle" placeholder="@" onChange={(e) => updateSocialPost(index, e)} />
                <label>
                  <span>Message </span>
                  {post.type == 'twitter' && (
                    <span style={{ color: post.messageLength > 280 ? 'red' : 'inherit' }}>{`${post.messageLength ?? 0}/280`}</span>
                  )}
                </label>
                <textarea value={post.message} name="message" required onChange={(e) => handleMessageUpdate(index, e.target.value)} ></textarea>
                <Flex direction="column" gap=".1em">
                  <label>Scheduled Date and Time:</label>
                  <Flex direction="row" >
                    <input type="datetime-local" value={post.scheduledDate} disabled={post.autoSchedule} name="scheduledDate" onChange={(e) => updateSocialPost(index, e)} style={{ width: "fit-content" }} />
                    {post.handle?.toLowerCase()?.includes('momentohq') && <CheckboxField label="Auto-schedule" value={post.autoSchedule} checked={post.autoSchedule} name="autoSchedule" onChange={(e) => handleBooleanChange(index, e)} />}
                  </Flex>
                </Flex>
                <label>Link to published version</label>
                <input type="url" value={post.link} name="link" onChange={(e) => updateSocialPost(index, e)} />
                <Flex direction="row" justifyContent="flex-end">
                  <Button variation='warning' onClick={(e) => handleDelete(index, e)} width="8em">{post.id ? 'Delete' : 'Cancel'}</Button>
                  <Button type="submit" variation="primary" width="8em">{post.id ? 'Update' : 'Add'}</Button>
                </Flex>
              </Flex>
            </form>
          </ExpanderItem>
        ))}
      </Expander>
    </Card >
  );
}

export const CustomTitle = ({ type, handle, message, scheduledDate }) => {
  const getDisplayText = (handle, message) => {
    let displayText = message?.length > 120 ? message.slice(0, 117) + "..." : message;
    if (handle) {
      return <Text><b>{handle.startsWith('@') ? handle : '@' + handle}</b> - {displayText}</Text>
    } else {
      return <Text>{displayText}</Text>
    }
  }

  return (
    <Flex gap="small" direction="row" justifyContent="space-between" width="100%" paddingRight="1em" alignItems="center">
      <Badge variation={type == "twitter" ? "info" : "warning"}>{type}</Badge>
      {getDisplayText(handle, message)}
      <Text variation={scheduledDate ? "primary" : "error"}>{new Date(scheduledDate).toLocaleDateString('en-US', { weekday: 'short', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) ?? 'Not scheduled'}</Text>
    </Flex>
  );
};

export default SocialPostsTracker;
