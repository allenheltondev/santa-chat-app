import { useRouter } from 'next/router';
import { Card, Flex, Heading, Text, Button, TableRow, TableCell } from '@aws-amplify/ui-react';
import { BiDotsVerticalRounded } from 'react-icons/bi';
import { Menu, Item, useContextMenu, Separator } from 'react-contexify';
import { getStatusBadge } from '../utils/utils';
import { API } from 'aws-amplify';
import { useState } from 'react';
const OPTIONS = 'optionsmenu';

const ContentRow = ({ content, jwt, refresh, showSummary, user }) => {
  const router = useRouter();
  const [isScheduleVisible, setIsScheduleVisible] = useState(false);
  const [isCompleteVisible, setIsCompleteVisible] = useState(false);
  const [assignee, setAssignee] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [contentUrl, setContentUrl] = useState('');

  const menuId = `${OPTIONS}-${content.id}`;
  const { show } = useContextMenu({ id: menuId });

  const handleContextMenu = (event) => {
    event.stopPropagation();
    show({ event });
  };

  const updateStatus = async (id, status, body = {}) => {
    body.status = status;
    await API.put('ContentApi',
      `/${id}/statuses`,
      {
        headers: {
          Authorization: `Bearer ${jwt}`
        },
        body
      });
    refresh();
  }

  const handleOnSchedule = async (id) => {
    const body = {
      assignee,
      scheduledDate
    };
    updateStatus(id, 'Scheduled', body);
    setIsScheduleVisible(false);
  };

  const handleOnComplete = async (id) => {
    updateStatus(id, 'Completed');
    if (contentUrl) {
      await API.post('ContentApi', `/${content.id}/copies`, {
        headers: { Authorization: `Bearer ${jwt}` },
        body: {
          type: 'Live Version',
          url: contentUrl
        }
      });
    }
    setIsCompleteVisible(false);
  };

  return (
    <>
      <TableRow
        key={content.id}
        onClick={() => router.push(`/content/${content.id}`)}
        style={{
          cursor: "pointer",
          backgroundColor: (user && user.includes(content.assignee)) ? '#EAF8B6' : content.isFromAdvocate ? '#abe7d2' : ''
        }}>
        <TableCell >{content.type.join(', ')}</TableCell>
        <TableCell >{content.title}</TableCell>
        {!showSummary && (
          <><TableCell >{content.services.join(', ')}</TableCell>
            <TableCell >{getStatusBadge(content.status, 'small')}</TableCell>
          </>
        )}
        <TableCell >{content.scheduledDate ? new Date(`${content.scheduledDate}T23:59:59Z`).toLocaleString('en-US', {
          month: 'short',
          day: '2-digit'
        }) : ''}</TableCell>
        <TableCell> <BiDotsVerticalRounded size="20" style={{ cursor: 'pointer' }} onClick={handleContextMenu} /></TableCell>
        <Menu id={menuId}>
          {content.status != 'Rejected' && <Item id="reject" onClick={updateStatus.bind(null, content.id, 'Rejected', {})}>Reject</Item>}
          {content.status != 'Accepted' && <Item id="accept" onClick={updateStatus.bind(null, content.id, 'Accepted', {})}>Accept</Item>}
          {content.status != 'Scheduled' && <Item id="schedule" onClick={() => setIsScheduleVisible(true)}>Schedule</Item>}
          {content.status != 'Completed' && <Item id="complete" onClick={() => setIsCompleteVisible(true)}>Complete</Item>}
          <Separator />
          <Item id="edit" onClick={() => router.push(`/content/${content.id}`)}>Edit</Item>
        </Menu>
      </TableRow>
      {isScheduleVisible && (
        <Card variation="outlined" boxShadow="large" borderRadius='large' width="50%" position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" style={{ zIndex: 1000 }}>
          <Flex direction="column" width="100%" justifyContent="center">
            <Heading level={4}>Schedule Content</Heading>
            <Text>Please fill out the following information to schedule</Text>
            <Flex direction="column">
              <label htmlFor="assignee_field">Who will create this content</label>
              <input id="assignee_field" type="text" value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder='Assign a creator' />
              <label htmlFor="date_field">Scheduled date</label>
              <input id="date_field" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
            </Flex>
            <Flex direction="row" justifyContent="space-between">
              <Button variation="warning" onClick={() => setIsScheduleVisible(false)}>Cancel</Button>
              <Button variation="primary" isDisabled={!assignee || !scheduledDate} onClick={handleOnSchedule.bind(null, content.id)}>Schedule</Button>
            </Flex>
          </Flex>
        </Card>
      )}
      {isCompleteVisible && (
        <Card variation="outlined" boxShadow="large" borderRadius='large' width="50%" position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" style={{ zIndex: 1000 }}>
          <Flex direction="column" width="100%" justifyContent="center">
            <Heading level={4}>Complete Content</Heading>
            <Text>Please share the link to the completed content</Text>
            <Flex direction="column">
              <label htmlFor="contenturl_field">Link to content (optional)</label>
              <input id="contenturl_field" type="text" value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} />
            </Flex>
            <Flex direction="row" justifyContent="flex-end">
              <Button variation="warning" onClick={() => setIsCompleteVisible(false)}>Cancel</Button>
              <Button variation="primary" onClick={handleOnComplete.bind(null, content.id)}>Complete</Button>
            </Flex>
          </Flex>
        </Card>
      )}
    </>
  )
};

export default ContentRow;
