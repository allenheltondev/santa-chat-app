import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Flex, Card, Heading, Table, TableBody, TableCell, TableHead, TableRow, Loader, View, Button, ToggleButton, ToggleButtonGroup } from '@aws-amplify/ui-react';
import Head from 'next/head';
import { API, Auth } from 'aws-amplify';
import { MdRefresh, MdOutlineCalendarMonth, MdFormatListBulleted } from 'react-icons/md';
import { IoStatsChartSharp, IoChevronBackOutline, IoChevronForwardOutline } from 'react-icons/io5';
import ContentRow from '../../components/ContentRow';
import Charts from '../../components/Charts';
import { toast } from 'react-toastify';
import { getFirstDayOfMonth, getNextMonth, getPreviousMonth } from '../../utils/utils';
import ContentCalendar from '../../components/ContentCalendar';

const SchedulePage = () => {
  const router = useRouter();
  const [content, setContent] = useState([]);
  const [token, setToken] = useState(null);
  const [month, setMonth] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [isGoalPopupVisible, setIsGoalPopupVisible] = useState(false);
  const [contentCount, setContentCount] = useState(0);
  const [sortColumn, setSortColumn] = useState("scheduledDate");
  const [sortDirection, setSortDirection] = useState("asc");
  const [userEmail, setUserEmail] = useState(null);
  const [displayMode, setDisplayMode] = useState('calendar');

  useEffect(() => {
    const loadContent = async () => {
      const session = await Auth.currentSession();
      const jwt = session.getIdToken().getJwtToken();
      const user = await Auth.currentUserInfo();
      setUserEmail(user.attributes.email);
      setToken(jwt);
      let date = router.query.startDate;
      if (!date) {
        date = getFirstDayOfMonth();
      }
      setStartDate(date);
    };

    loadContent();
  }, []);

  useEffect(() => {
    if (startDate && token) {
      refresh();
      loadGoals();

      const monthName = new Date(`${startDate}T23:59:59Z`).toLocaleString('en-US', { month: 'long' });
      setMonth(monthName);
    }
  }, [startDate, token]);

  const loadGoals = async () => {
    try {
      const response = await API.get('ContentApi', `/goals/${startDate}`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.contentCount) {
        setContentCount(Number(response.contentCount));
      }
    } catch (err) {
      if (err.response?.status != 404) {
        toast.error('Could not load monthly goals', { position: 'top-right', autoClose: 10000, draggable: false, hideProgressBar: true, theme: 'colored' });
        console.error(err.response);
      }
    }
  };

  const refresh = async () => {
    setIsFetching(true);
    try {
      const response = await API.get('ContentApi', `/ranges/${startDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          queryStringParameters: {
            showUnscheduled: true,
            showCompleted: true
          }
        });
      setContent(response.content);
    } catch (err) {
      console.error(err);
    }
    finally {
      setIsFetching(false);
    }
  };

  const handleSetGoals = async () => {
    API.put('ContentApi',
      `/goals/${startDate}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: {
          contentCount: Number(contentCount)
        }
      });
    setIsGoalPopupVisible(false);
    refresh();
  };

  const changeMonth = async (goForward) => {
    let date;
    if (goForward) {
      date = getNextMonth(startDate);
    } else {
      date = getPreviousMonth(startDate);
    }
    setStartDate(date);
  };

  const sortedContent = [...content].sort((a, b) => {
    if (sortDirection === "asc") {
      if (a[sortColumn] < b[sortColumn]) return -1;
      if (a[sortColumn] > b[sortColumn]) return 1;
      return 0;
    } else {
      if (a[sortColumn] > b[sortColumn]) return -1;
      if (a[sortColumn] < b[sortColumn]) return 1;
      return 0;
    }
  });

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  return (
    <>
      <Head>
        <title>Momento Content Schedule</title>
      </Head>
      <Flex direction="column" width="100%" alignItems="center">
        <Flex direction="column" width="90%">
          <Card variation="elevated" textAlign="center" width="100%" padding="small">
            <Flex direction="row" justifyContent='space-between'>
              <View />
              <Flex direction="row" alignItems="center" width="50%" justifyContent="space-between">
                <IoChevronBackOutline size="1.5em" color="black" cursor="pointer" onClick={() => changeMonth(false)} />
                <Heading level={3}>{month} Content Plan</Heading>
                <IoChevronForwardOutline size="1.5em" color="black" cursor="pointer" onClick={() => changeMonth(true)} />
              </Flex>
              <ToggleButtonGroup value={displayMode} isExclusive onChange={(e) => setDisplayMode(e)}>
                  <ToggleButton value="calendar">
                    <MdOutlineCalendarMonth size="1.5em"/>
                  </ToggleButton>
                  <ToggleButton value="list">
                    <MdFormatListBulleted size="1.5em"/>
                  </ToggleButton>
                </ToggleButtonGroup>
            </Flex>
          </Card>
          <View height="30%">
            <Charts data={content} contentCountGoal={contentCount} />
          </View>
          {displayMode == 'calendar' && (<ContentCalendar events={content} startDate={startDate} refresh={refresh} />)}
          {displayMode == 'list' && (<Table highlightOnHover="true" backgroundColor="white" boxShadow="medium" size="small">
            <TableHead >
              <TableRow backgroundColor="#25392B">
                <TableCell as="th" fontSize="large" color="white" style={{ cursor: 'pointer' }} onClick={() => handleSort('type')}>Type {sortColumn === 'type' && (sortDirection === "asc" ? "↑" : "↓")}</TableCell>
                <TableCell as="th" fontSize="large" color="white" style={{ cursor: 'pointer' }} onClick={() => handleSort('title')}>Title {sortColumn === 'title' && (sortDirection === "asc" ? "↑" : "↓")}</TableCell>
                <TableCell as="th" fontSize="large" color="white" style={{ cursor: 'pointer' }} onClick={() => handleSort('services')}>Services {sortColumn === 'services' && (sortDirection === "asc" ? "↑" : "↓")}</TableCell>
                <TableCell as="th" fontSize="large" color="white" style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>Status {sortColumn === 'status' && (sortDirection === "asc" ? "↑" : "↓")}</TableCell>
                <TableCell as="th" fontSize="large" color="white" style={{ cursor: 'pointer' }} onClick={() => handleSort('scheduledDate')}>Scheduled Date {sortColumn === 'scheduledDate' && (sortDirection === "asc" ? "↑" : "↓")}</TableCell>
                <TableCell as="th" > {isFetching ? <Loader size="2em" /> : <MdRefresh size="2em" cursor="pointer" color="white" onClick={refresh} />}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedContent?.map((post) => (
                <ContentRow content={post} jwt={token} refresh={refresh} key={post.id} user={userEmail} />
              ))}
            </TableBody>
          </Table>
          )}
        </Flex>
      </Flex>
      {isGoalPopupVisible && (
        <Card variation="outlined" boxShadow="large" borderRadius='large' width="50%" position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" style={{ zIndex: 1000 }}>
          <Flex direction="column" width="100%" justifyContent="center">
            <Heading level={4}>Set {month} Goals</Heading>
            <Flex direction="column">
              <label htmlFor="contentCount_field">Target amount of content</label>
              <input id="contentCount_field" type="number" value={contentCount} onChange={(e) => setContentCount(e.target.value)} />
            </Flex>
            <Flex direction="row" justifyContent="space-between">
              <Button variation="warning" onClick={() => setIsGoalPopupVisible(false)}>Cancel</Button>
              <Button variation="primary" isDisabled={!contentCount} onClick={handleSetGoals}>Set Goals</Button>
            </Flex>
          </Flex>
        </Card>
      )}
    </>
  );
};

export default SchedulePage;
