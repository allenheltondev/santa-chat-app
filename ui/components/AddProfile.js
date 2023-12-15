import { Flex, Card, TextField, Button, Heading, Divider } from "@aws-amplify/ui-react";
import { useState } from "react";
import { API } from 'aws-amplify';
import { toast } from 'react-toastify';

const AddProfile = ({ onClose, token }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({name: '', age: '', gender: 'female'});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newProfile = {
      ...profile,
      [name]: value
    };
    setProfile(newProfile);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const response = await API.post('Admin', '/profiles', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: {
          name: profile.name,
          age: Number(profile.age),
          gender: profile.gender
        }
      });

      onClose(response.passcode);
    } catch (err) {
      console.error(err);
      toast.error('Error creating profile', { position: 'top-right', autoClose: 10000, draggable: false, hideProgressBar: true, theme: 'colored' });
    } finally {
      setIsSaving(false);
    }

    onClose();
  };

  return (
    <Card variation="outlined" boxShadow="large" borderRadius="large" width="50%" position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" style={{ zIndex: 1000 }}>
      <Flex direction="column" justifyContent="space-between" height="100%">
        <Flex direction="column" gap=".5em" paddingLeft="1em" paddingRight="1em" paddingBottom="1em">
          <Heading level={5}>Add new profile</Heading>
          <Divider size="small" marginBottom="1em" marginTop=".5em" />
          <form id="profile_form" onSubmit={saveProfile}>
            <TextField label={<b>Name</b>} value={profile.name} name="name" required onChange={handleInputChange} marginBottom=".5em" />
            <TextField label={<b>Age</b>} value={profile.age} name="age" required type="number" onChange={handleInputChange} marginBottom=".5em" />
            <label htmlFor="gender_field"><b>Gender</b></label>
            <select id="gender_field" name="gender" required value={profile.gender} onChange={handleInputChange} style={{ padding: ".5em", width: "100%", marginTop: ".5em" }}>
              <option key="female" value="female">Female</option>
              <option key="male" value="male">Male</option>
              <option key="other" value="other">Other</option>
            </select>
          </form>
        </Flex>
        <Flex direction="row" justifyContent="right">
          <Flex direction="row" alignItems="center" justifyContent="flex-end" paddingLeft="1em" paddingRight="1em" >
            <Button onClick={() => onClose()}>Cancel</Button>
            <Button variation="primary" isLoading={isSaving} type="submit" form="profile_form" >Add</Button>
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
};

export default AddProfile;
