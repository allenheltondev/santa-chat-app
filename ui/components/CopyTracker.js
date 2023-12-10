import { useState, useEffect } from 'react';
import { Flex, Card, Text, Button, Badge, Heading, Expander, ExpanderItem } from "@aws-amplify/ui-react";
import { API } from 'aws-amplify';
import { toast } from 'react-toastify';
import { IoMdAddCircle } from 'react-icons/io';
import { getContentCopies } from '../services/ContentService';

const CopyTracker = ({ contentId, token }) => {
  const [copies, setCopies] = useState([]);

  useEffect(() => {
    if (contentId && token) {
      fetchCopies();
    }
  }, [token, contentId]);

  const fetchCopies = async () => {
    try {
      const response = await getContentCopies(token, contentId);
      setCopies(response);
    } catch (error) {
      console.error("Error fetching copies:", error);
      toast.error('Error loading copies', { position: 'top-right', autoClose: 10000, draggable: false, hideProgressBar: true, theme: 'colored' });
    }
  };

  const handleDelete = async (index, event) => {
    event.preventDefault();
    const copy = copies[index];
    await API.del('ContentApi', `/${contentId}/copies/${copy.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    const newCopies = [...copies];
    newCopies.splice(index, 1);
    setCopies(newCopies);
  };

  const saveCopy = async (index, event) => {
    event.preventDefault();
    const copy = copies[index];
    const params = {
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: copy
    };

    if (!copy.id) {
      const response = await API.post('ContentApi', `/${contentId}/copies`, params);
      updateCopy(index, { target: { name: 'id', value: response.id } });
      toast.success('Copy added!', { position: 'top-right', autoClose: 10000, draggable: false, hideProgressBar: true, theme: 'colored' });
    } else {
      await API.put('ContentApi', `/${contentId}/copies/${copy.id}`, params);
      toast.success('Updated successfully', { position: 'top-right', autoClose: 10000, draggable: false, hideProgressBar: true, theme: 'colored' });
    }
  }

  const updateCopy = async (index, event) => {
    const { name, value } = event.target;
    const updatedCopies = [...copies];
    updatedCopies[index] = {
      ...updatedCopies[index],
      [name]: value,
    };
    setCopies(updatedCopies);
  };

  return (
    <Card variation="outlined" width='100%' height="auto">
      <Flex direction="column" gap=".5em" marginBottom="1em">
        <Flex direction="row" justifyContent="space-between">
          <Heading level={5}>Copies</Heading>
          <IoMdAddCircle size="2em" style={{ cursor: "pointer" }} onClick={() => setCopies([...copies, { type: 'Draft' }])} />
        </Flex>
        <Text>Save links to your work in progress, live version, and cross-posts</Text>
      </Flex>
      <Expander type="single" isCollapsible={true}>
        {copies.map((copy, index) => (
          <ExpanderItem key={`copy-${index}`} value={`copy-${index}`} title={<CustomTitle type={copy.type} url={copy.url} />}>
            <form onSubmit={(e) => saveCopy(index, e)}>
              <Flex direction="column" gap=".5em" >
                <label>Type:</label>
                <select value={copy.type} name="type" required onChange={(e) => updateCopy(index, e)}>
                  <option value="Draft">Draft</option>
                  <option value="Live Version">Live Version</option>
                  <option value="Cross-post">Cross-post</option>
                  <option value="Reference Material">Reference Material</option>
                </select>
                <label>Link:</label>
                <input type="url" value={copy.url} name="url" onChange={(e) => updateCopy(index, e)} />
                <Flex direction="row" justifyContent="flex-end">
                  <Button variation='warning' onClick={(e) => handleDelete(index, e)} width="8em">{copy.id ? 'Delete' : 'Cancel'}</Button>
                  <Button type="submit" variation="primary" width="8em">{copy.id ? 'Update' : 'Add'}</Button>
                </Flex>
              </Flex>
            </form>
          </ExpanderItem>
        ))}
      </Expander>
    </Card >
  );
}

export const CustomTitle = ({ type, url }) => {
  const getBadgeVariation = (type) => {
    switch (type) {
      case 'Live Version':
        return 'info'
      case 'Cross-post':
        return 'success'
      case 'Reference Material':
        return 'warning'
      default:
        return ''
    };
  };

  return (
    <Flex gap="medium" direction="row" justifyContent="flex-start" width="100%" paddingRight="1em" alignItems="center">
      <Badge variation={getBadgeVariation(type)}>{type}</Badge>
      <Text>{url?.length > 120 ? url.slice(0, 117) + "..." : url}</Text>
    </Flex>
  );
};

export default CopyTracker;
