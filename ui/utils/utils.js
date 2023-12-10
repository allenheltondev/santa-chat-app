import { Badge } from '@aws-amplify/ui-react';
export const getStatusBadge = (status, size = "large") => {
  let label, variation;
  switch (status) {
    case 'Submitted':
      label = 'Pending';
      variation = '';
      break;
    case 'Accepted':
      label = 'Waiting to be scheduled';
      variation = 'warning';
      break;
    case 'Completed':
      label = 'Done';
      variation = 'success';
      break;
    case 'Rejected':
      label = 'Rejected';
      variation = 'error';
      break;
    case 'Scheduled':
      label = 'Scheduled';
      variation = 'info';
      break;
    default:
      label = status;
      variation = '';
      break;
  };

  return (<Badge size={size} variation={variation}>{label}</Badge>);
};

export const getFirstDayOfMonth = () => {
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const yyyy = firstDay.getFullYear();
  const mm = String(firstDay.getMonth() + 1).padStart(2, '0');
  const dd = '01';

  return `${yyyy}-${mm}-${dd}`;
};

export const getNextMonth = (date) => {
  const newDate = new Date(`${date}T23:59:59Z`);
  newDate.setDate(1);
  newDate.setMonth(newDate.getMonth() + 1);
  return newDate.toISOString().split('T')[0];
};

export const getPreviousMonth = (date) => {
  const newDate = new Date(`${date}T23:59:59Z`);
  newDate.setDate(1);
  newDate.setMonth(newDate.getMonth() - 1);
  return newDate.toISOString().split('T')[0];
};

export const getDateString = (utcDate) => {
  return new Date(utcDate).toISOString().split('T')[0];
};
