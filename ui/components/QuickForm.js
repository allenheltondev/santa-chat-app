import { Flex, Card, TextField, Button, Divider, CheckboxField, Text } from "@aws-amplify/ui-react";
import { useRouter } from 'next/router';
import { useEffect, useState } from "react";
import { API } from 'aws-amplify';
import { services, contentTypes, statuses } from "../lib/formFields";
import { getContentMetadata, updateContentStatus } from "../services/ContentService";
import { IoIosArrowRoundForward } from "react-icons/io";
import { toast } from 'react-toastify';

const QuickForm = ({ token, contentId, seedDate, onClose }) => {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [content, setContent] = useState({ ...seedDate && { scheduledDate: seedDate } });
  const isNewContent = !contentId;

  useEffect(() => {
    const loadMetadata = async () => {
      const metadata = await getContentMetadata(token, contentId);
      setContent(metadata);

    };
    if (contentId) {
      loadMetadata();
    }
  }, [contentId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newContent = {
      ...content,
      [name]: value
    };
    setContent(newContent);
    localStorage.setItem('draft', JSON.stringify(newContent));
  };

  const handleStatusChange = async (s) => {
    await updateContentStatus(token, content.id, s);
    const newContent = { ...content, status: s };
    setContent(newContent);
  };

  const updateContentTypes = (contentType) => {
    const selectedTypes = [...content?.type ?? []];
    const index = selectedTypes.findIndex(ct => ct == contentType);
    if (index > -1) {
      selectedTypes.splice(index, 1);
    } else {
      selectedTypes.push(contentType);
    }
    setContent((prev) => ({ ...prev, type: selectedTypes }));
  };

  const updateServices = (service) => {
    const selectedServices = [...content?.services ?? []];
    const index = selectedServices.findIndex(s => s == service);
    if (index > -1) {
      selectedServices.splice(index, 1);
    } else {
      selectedServices.push(service);
    }
    setContent((prev) => ({ ...prev, services: selectedServices }));
  };

  const saveData = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const params = {
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: {
          title: content.title,
          assignee: content.assignee,
          type: content.type,
          services: content.services,
          ...content.scheduledDate && { scheduledDate: content.scheduledDate }
        }
      };

      if (isNewContent) {
        await API.post('ContentApi', '/', params);
      } else {
        await API.patch('ContentApi', `/${router.query.contentId}`, params);
      }

      toast.success(isNewContent ? 'Thank you for your idea!' : 'Content updated', { position: 'top-right', autoClose: 10000, draggable: false, hideProgressBar: true, theme: 'colored' });
      localStorage.removeItem('draft');
    } catch (err) {
      console.error(err);
      toast.error(isNewContent ? 'Error submitting content' : 'Could not update content', { position: 'top-right', autoClose: 10000, draggable: false, hideProgressBar: true, theme: 'colored' });
    } finally {
      setIsSaving(false);
    }

    onClose(true);
  };

  return (
    <Card variation="outlined" boxShadow="large" borderRadius="large" width="50%" position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" style={{ zIndex: 1000 }}>
      <Flex direction="column" justifyContent="space-between" height="100%">
        <Flex direction="column" gap=".5em" paddingLeft="1em" paddingRight="1em" paddingBottom="1em">
          <form id="content_form" onSubmit={saveData}>
            <TextField label={<b>Title</b>} value={content.title} name="title" required onChange={handleInputChange} marginBottom=".5em" />
            <Text marginBottom=".5em"><b>Content Type</b></Text>
            <Flex direction="row" wrap="wrap" gap="1em" marginBottom=".5em">
              {contentTypes.map(ct => (
                <CheckboxField label={ct} key={ct} value={ct} onChange={() => updateContentTypes(ct)} checked={content.type?.includes(ct)} />
              ))}
            </Flex>
            <Text marginTop="1em" marginBottom=".5em"><b>Services</b></Text>
            <Flex direction="row" wrap="wrap" gap="1em">
              {services.map(s => (
                <CheckboxField label={s} key={s} value={s} onChange={() => updateServices(s)} checked={content.services?.includes(s)} />
              ))}
            </Flex>
            <Divider size="small" marginTop="1em" marginBottom="1em" />
            <Flex direction="row">
              <Flex direction="column" gap=".2em" marginBottom=".5em">
                <label htmlFor="date_field">Scheduled date</label>
                <input id="date_field" name="scheduledDate" type="date" value={content.scheduledDate} onChange={handleInputChange} style={{ padding: ".5em", width: "fit-content" }} />
              </Flex>
              <TextField label="Assignee" value={content.assignee} name="assignee" onChange={handleInputChange} width="33%" />
            </Flex>
            {!isNewContent && (
              <>
                <label htmlFor="seo_field">Status</label>
                <select id="status_field" name="status" required value={content.status} onChange={(e) => handleStatusChange(e.target.value)} style={{ padding: ".5em", width: "100%" }}>
                  {statuses.map(s => (
                    <option value={s} key={s}>{s}</option>
                  ))}
                </select>
              </>
            )}
          </form>
        </Flex>
        <Flex direction="row" justifyContent="space-between">
          <Flex>
            {!isNewContent && (
              <Button variation="link" onClick={() => router.push(`/content/${content.id}`)}>
                <Flex direction="row" alignItems="center" gap=".5em">
                  View Details <IoIosArrowRoundForward size="1.5em"/>
                </Flex>
              </Button>

            )}
          </Flex>
          <Flex direction="row" alignItems="center" justifyContent="flex-end" paddingLeft="1em" paddingRight="1em" >
            <Button onClick={() => onClose(false)}>Cancel</Button>
            <Button variation="primary" isLoading={isSaving} type="submit" form="content_form" >{isNewContent ? 'Submit' : 'Update'}</Button>
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
};

export default QuickForm;
