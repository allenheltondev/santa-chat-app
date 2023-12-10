import { Flex, Card, TextField, TextAreaField, Button, Divider, CheckboxField, Text } from "@aws-amplify/ui-react";
import { useRouter } from 'next/router';
import { useEffect, useState } from "react";
import { API } from 'aws-amplify';
import { services, seoKeywords, audiences, contentTypes, statuses } from "../lib/formFields";
import { toast } from 'react-toastify';

const ContentForm = ({ token, content, setContent, isNewContent }) => {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isNewContent) {
      const savedDraft = localStorage.getItem('draft');
      if (savedDraft) {
        setContent(JSON.parse(savedDraft));
      }
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newContent = {
      ...content,
      [name]: value
    };
    setContent(newContent);
    localStorage.setItem('draft', JSON.stringify(newContent));
  };

  const handleBooleanChange = (e) => {
    const { name } = e.target;
    const newContent = {
      ...content,
      [name]: e.target.checked
    };
    setContent(newContent);
    localStorage.setItem('draft', JSON.stringify(newContent));
  }

  const handleStatusChange = async (s) => {
    await API.put('ContentApi',
      `/${content.id}/statuses`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: { status: s }
      });

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
          summary: content.summary,
          audience: content.audience,
          takeaway: content.takeaway,
          seoKeyword: content.seoKeyword,
          assignee: content.assignee,
          type: content.type,
          services: content.services,
          isFromAdvocate: content.isFromAdvocate,
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
      router.back();
    } catch (err) {
      console.error(err);
      toast.error(isNewContent ? 'Error submitting content' : 'Could not update content', { position: 'top-right', autoClose: 10000, draggable: false, hideProgressBar: true, theme: 'colored' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Card variation="elevated" width="100%">
        <Flex direction="column" justifyContent="space-between" height="100%">
          <Flex direction="column" gap=".5em" paddingLeft="1em" paddingRight="1em" paddingBottom="1em">
            <form id="content_form" onSubmit={saveData}>
              <TextField label="Title" value={content.title} name="title" required onChange={handleInputChange} marginBottom=".5em" />
              <TextAreaField label="Summary" value={content.summary} name="summary" required marginBottom=".5em" resize="vertical" onChange={handleInputChange} rows={3} />
              <Text>Services</Text>
              <Flex direction="row" wrap="wrap" gap="1em" marginBottom=".5em">
                {services.map(s => (
                  <CheckboxField label={s} key={s} value={s} onChange={() => updateServices(s)} checked={content.services?.includes(s)} />
                ))}
              </Flex>
              <Text>Content Type</Text>
              <Flex direction="row" wrap="wrap" gap="1em" marginBottom=".5em">
                {contentTypes.map(ct => (
                  <CheckboxField label={ct} key={ct} value={ct} onChange={() => updateContentTypes(ct)} checked={content.type?.includes(ct)} />
                ))}
              </Flex>
              <label htmlFor="audience_field">Audience</label>
              <select id="audience_field" name="audience" required value={content.audience} onChange={handleInputChange} style={{ padding: ".5em", width: "100%", marginBottom: ".5em" }}>
                {audiences.map(a => (
                  <option value={a} key={a}>{a}</option>
                ))}
              </select>
              <TextField label="Key takeaway" name="takeaway" required value={content.takeaway} onChange={handleInputChange} marginBottom=".5em" />
              <label htmlFor="seo_field">SEO keyword</label>
              <select id="seo_field" name="seoKeyword" required value={content.seoKeyword} onChange={handleInputChange} style={{ padding: ".5em", width: "100%" }}>
                {seoKeywords.map(keyword => (
                  <option value={keyword} key={keyword}>{keyword}</option>
                ))}
              </select>
              <Divider marginTop="2em" marginBottom="1em" />
              <Flex direction="row" marginBottom=".5em" justifyContent="flex-start" alignItems="normal">
                <TextField label="Assignee" value={content.assignee} name="assignee" onChange={handleInputChange} width="33%" />
                <CheckboxField label="Is Momento Advocate?" marginTop="1.5em" value={content.isFromAdvocate} checked={content.isFromAdvocate} name="isFromAdvocate" onChange={handleBooleanChange} />
              </Flex>
              <Flex direction="column" gap=".2em" marginBottom=".5em">
                <label htmlFor="date_field">Scheduled date</label>
                <input id="date_field" name="scheduledDate" type="date" value={content.scheduledDate} onChange={handleInputChange} style={{ padding: ".5em", width: "fit-content" }} />
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
          <Flex direction="column">
            <Divider size="small" />
            <Flex direction="row" alignItems="center" justifyContent="flex-end" paddingLeft="1em" paddingRight="1em" >
              <Button onClick={() => router.back()}>Cancel</Button>
              <Button variation="primary" isLoading={isSaving} type="submit" form="content_form" >{isNewContent ? 'Submit' : 'Update'}</Button>
            </Flex>
          </Flex>
        </Flex>
      </Card>
    </>
  );
};

export default ContentForm;
