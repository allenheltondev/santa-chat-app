import { API } from 'aws-amplify';
import moment from 'moment';

export const getContentMetadata = async (token, contentId) => {
  const response = await API.get('ContentApi',
    `/${contentId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

  return response;
};

export const getContentCopies = async (token, contentId) => {
  const response = await API.get('ContentApi',
    `/${contentId}/copies`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

  return response.copies;
};

export const updateContentStatus = async (token, contentId, status) => {
  await API.put('ContentApi',
    `/${contentId}/statuses`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: { status }
    });
};

export const updateContent = async (token, contentId, data) => {
  await API.patch('ContentApi', `/${contentId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: data
  });
};

export const getSocialPosts = async (token, startDate, endDate) => {
  if (!endDate) {
    let date = moment(startDate);
    endDate = date.clone().endOf('month').format('YYYY-MM-DD');
  }

  let response = await API.get('ContentApi', `/social-posts?startDate=${startDate}&endDate=${endDate}T23:59:59`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.posts;
};
