import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card } from "@aws-amplify/ui-react";
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from "react";
import { updateContent, getSocialPosts } from "../services/ContentService";
import { getDateString } from "../utils/utils";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import TokenContext from "../services/TokenContext";
import QuickForm from "./QuickForm";

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

const ContentCalendar = ({ events, startDate, refresh }) => {
  const router = useRouter();
  const { token, refreshToken } = useContext(TokenContext);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [clickTimeout, setClickTimeout] = useState(null);
  const [contentId, setContentId] = useState('');
  const [seedDate, setSeedDate] = useState('');
  const [calendarDate, setCalendarDate] = useState(startDate);
  const [contentEvents, setContentEvents] = useState([]);
  const [socialEvents, setSocialEvents] = useState([]);

  useEffect(() => {
    const viewableEvents = events?.map(c => {
      const event = {
        id: c.id,
        title: c.title,
        ...c.scheduledDate && {
          start: new Date(`${c.scheduledDate}T00:00:00`),
          end: new Date(`${c.scheduledDate}T23:59:59`),
          allDay: true
        },
        type: 'content'
      };
      return event;
    }).filter(e => e.start);

    setContentEvents(viewableEvents);
  }, [events]);

  useEffect(() => {
    const loadSocialMediaEvents = async () => {
      const posts = await getSocialPosts(token, startDate);
      const viewableSocialPosts = posts.map(p => {
        const post = {
          id: p.id,
          title: `${p.type} - ${p.message.substring(0, 10)}`,
          ...p.scheduledDate && {
            start: p.scheduledDate,
            end: moment(p.scheduledDate).add(15, 'minutes').format(),
            allDay: false
          },
          type: 'social media'
        };
        return post;
      }).filter(p => p.start);

      setSocialEvents(viewableSocialPosts);
    };

    if (startDate) {
      loadSocialMediaEvents();
      setCalendarDate(startDate);
    }
  }, [startDate]);

  useEffect(() => {
    setCalendarEvents([...socialEvents, ...contentEvents]);
  }, [socialEvents, contentEvents]);

  const handleShowQuickForm = (event) => {
    const timeout = setTimeout(() => {
      setContentId(event.id);
      setShowQuickForm(true);
    }, 250);

    setClickTimeout(timeout);
  };

  const onClose = (shouldRefresh) => {
    setShowQuickForm(false);
    setContentId('');
    if (refresh && shouldRefresh) {
      refresh();
    }
  };

  const handleSlotClick = (event) => {
    const date = getDateString(event.start);
    setSeedDate(date);
    setShowQuickForm(true);
  };

  const handleDoubleClick = (event) => {
    clearTimeout(clickTimeout);

    router.push(`/content/${event.id}`);
  };

  const onEventDrop = async (event) => {
    updateContent(token, event.event.id, { scheduledDate: getDateString(event.start) });
    const updatedEvents = calendarEvents.map(ev => {
      if (ev.id === event.event.id) {
        return { ...ev, start: event.start, end: `${getDateString(event.start)}T23:59:59` };
      }
      return ev;
    });

    setCalendarEvents(updatedEvents);
  };

  const onNavigate = (newDate) => {
      setCalendarDate(newDate);
  };

  const eventStyleGetter = (event) => {
    let backgroundColor = '#25392B';
    let fontColor = 'white';
    switch (event.type) {
      case 'social media':
        backgroundColor = '#C4F135';
        fontColor = 'black';
        break;
      // add more as we get more types
    }

    const style = {
      backgroundColor: backgroundColor,
      borderRadius: '0px',
      color: fontColor,
      border: '0px',
      display: 'block'
    };

    return { style };
  };

  return (
    <>
      <Card variation="elevated" height="35em">
        <DnDCalendar
          localizer={localizer}
          defaultView="month"
          date={calendarDate}
          views={['month', 'week']}
          events={calendarEvents}
          selectable
          style={{ height: '100%' }}
          onDoubleClickEvent={handleDoubleClick}
          onSelectEvent={handleShowQuickForm}
          onSelectSlot={handleSlotClick}
          onEventDrop={onEventDrop}
          eventPropGetter={eventStyleGetter}
          onNavigate={onNavigate}
        />
      </Card>
      {showQuickForm && (
        <QuickForm token={token} contentId={contentId} onClose={onClose} seedDate={seedDate} />
      )}
    </>
  );
};

export default ContentCalendar;
