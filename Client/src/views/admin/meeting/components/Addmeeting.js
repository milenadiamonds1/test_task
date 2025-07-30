import {
    Button,
    Flex,
    FormLabel,
    Grid,
    GridItem,
    IconButton,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Radio,
    RadioGroup,
    Stack,
    Text,
    Textarea,
} from '@chakra-ui/react';
import { CUIAutoComplete } from 'chakra-ui-autocomplete';
import MultiContactModel from 'components/commonTableModel/MultiContactModel';
import MultiLeadModel from 'components/commonTableModel/MultiLeadModel';
import Spinner from 'components/spinner/Spinner';
import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { useEffect, useMemo, useState } from 'react';
import { LiaMousePointerSolid } from 'react-icons/lia';
import { toast } from 'react-toastify';
import { MeetingSchema } from 'schema';
import { getApi, postApi } from 'services/api';

const AddMeeting = ({ onClose, isOpen, setAction, leadContect, id }) => {
    const [leadData, setLeadData] = useState([]);
    const [contactData, setContactData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [contactModelOpen, setContactModel] = useState(false);
    const [leadModelOpen, setLeadModel] = useState(false);

    const user = useMemo(() => JSON.parse(localStorage.getItem('user')), []);
    const todayTime = useMemo(() => new Date().toISOString().split('.')[0], []);

    const initialValues = useMemo(() => ({
        agenda: '',
        attendees: leadContect === 'contactView' && id ? [id] : [],
        attendeesLead: leadContect === 'leadView' && id ? [id] : [],
        location: '',
        related: leadContect === 'contactView' ? 'Contact' : leadContect === 'leadView' ? 'Lead' : 'None',
        dateTime: '',
        notes: '',
        createBy: user?._id,
    }), [leadContect, id, user]);

    const formik = useFormik({
        initialValues,
        validationSchema: MeetingSchema,
        onSubmit: async (values, { resetForm }) => {
            setIsLoading(true);
            try {
                const payload = {
                    ...values,
                    attendees: values.related === "Contact" ? values.attendees : [],
                    attendeesLead: values.related === "Lead" ? values.attendeesLead : [],
                };
                const res = await postApi('api/meeting/add', payload);
                if (res.status === 200 || res.status === 201) {
                    toast.success("Meeting added successfully.");
                    resetForm();
                    onClose();
                    setAction(prev => !prev);
                } else toast.error("Something went wrong.");
            } catch (err) {
                console.error(err);
                toast.error("Server error.");
            } finally {
                setIsLoading(false);
            }
        },
    });

    const { errors, touched, values, handleBlur, handleChange, handleSubmit, setFieldValue } = formik;

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [leadRes, contactRes] = await Promise.all([
                    getApi("api/lead/"),
                    getApi("api/contact/")
                ]);
                if (leadRes.status === 200) setLeadData(leadRes.data);
                if (contactRes.status === 200) setContactData(contactRes.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchAllData();
    }, [id, values.related]);

    const selectableItems = useMemo(() => {
        const source = values.related === "Contact" ? contactData : leadData;
        return source?.map(item => ({
            ...item,
            value: item._id,
            label: values.related === "Contact" ? item.fullName : item.leadName
        })) || [];
    }, [values.related, contactData, leadData]);

    const selectedItems = useMemo(() =>
            selectableItems?.filter(item => (values.related === "Contact"
                ? values.attendees.includes(item._id)
                : values.attendeesLead.includes(item._id)))
        , [selectableItems, values]);

    return (
        <Modal onClose={onClose} isOpen={isOpen} isCentered>
            <ModalOverlay />
            <ModalContent height="580px">
                <ModalHeader>Add Meeting</ModalHeader>
                <ModalCloseButton />
                <ModalBody overflowY="auto" height="400px">
                    <MultiContactModel data={contactData} isOpen={contactModelOpen} onClose={setContactModel} fieldName='attendees' setFieldValue={setFieldValue} />
                    <MultiLeadModel data={leadData} isOpen={leadModelOpen} onClose={setLeadModel} fieldName='attendeesLead' setFieldValue={setFieldValue} />
                    <Grid templateColumns="repeat(12, 1fr)" gap={3}>

                        {/* Agenda */}
                        <GridItem colSpan={12}>
                            <FormLabel fontSize='sm' fontWeight='500'>Agenda<Text as='span' color='red'>*</Text></FormLabel>
                            <Input name="agenda" placeholder="Agenda" value={values.agenda} onChange={handleChange} onBlur={handleBlur} borderColor={errors.agenda && touched.agenda ? "red.300" : null} />
                            {errors.agenda && touched.agenda && <Text color='red' fontSize='sm'>{errors.agenda}</Text>}
                        </GridItem>

                        {/* Related To */}
                        <GridItem colSpan={12}>
                            <FormLabel fontSize='sm' fontWeight='500'>Related To<Text as='span' color='red'>*</Text></FormLabel>
                            <RadioGroup value={values.related} onChange={val => setFieldValue('related', val)}>
                                <Stack direction='row'>
                                    {leadContect === 'contactView' && <Radio value='Contact'>Contact</Radio>}
                                    {leadContect === 'leadView' && <Radio value='Lead'>Lead</Radio>}
                                    {!leadContect && (<><Radio value='Contact'>Contact</Radio><Radio value='Lead'>Lead</Radio></>)}
                                </Stack>
                            </RadioGroup>
                            {errors.related && touched.related && <Text color='red' fontSize='sm'>{errors.related}</Text>}
                        </GridItem>

                        {/* Attendees Selector */}
                        {selectableItems.length > 0 && values.related && (
                            <GridItem colSpan={12}>
                                <Flex align='end' justify='space-between'>
                                    <CUIAutoComplete
                                        label={`Choose Preferred attendees ${values.related}`}
                                        placeholder="Type a Name"
                                        items={selectableItems}
                                        selectedItems={selectedItems}
                                        onSelectedItemsChange={({ selectedItems }) => {
                                            const ids = selectedItems.map(i => i._id);
                                            if (values.related === "Contact") setFieldValue('attendees', ids);
                                            else setFieldValue('attendeesLead', ids);
                                        }}
                                    />
                                    <IconButton mb={6} fontSize='25px' icon={<LiaMousePointerSolid />} onClick={() => values.related === "Contact" ? setContactModel(true) : setLeadModel(true)} />
                                </Flex>
                                {errors.attendees && touched.attendees && <Text color='red'>{errors.attendees}</Text>}
                            </GridItem>
                        )}

                        {/* Location */}
                        <GridItem colSpan={12}>
                            <FormLabel fontSize='sm' fontWeight='500'>Location</FormLabel>
                            <Input name="location" placeholder="Location" value={values.location} onChange={handleChange} onBlur={handleBlur} borderColor={errors.location && touched.location ? "red.300" : null} />
                            {errors.location && touched.location && <Text color='red' fontSize='sm'>{errors.location}</Text>}
                        </GridItem>

                        {/* Date Time */}
                        <GridItem colSpan={12}>
                            <FormLabel fontSize='sm' fontWeight='500'>Date Time<Text as='span' color='red'>*</Text></FormLabel>
                            <Input type="datetime-local" name="dateTime" value={values.dateTime} onChange={handleChange} onBlur={handleBlur} min={dayjs(todayTime).format('YYYY-MM-DD HH:mm')} borderColor={errors.dateTime && touched.dateTime ? "red.300" : null} />
                            {errors.dateTime && touched.dateTime && <Text color='red' fontSize='sm'>{errors.dateTime}</Text>}
                        </GridItem>

                        {/* Notes */}
                        <GridItem colSpan={12}>
                            <FormLabel fontSize='sm' fontWeight='500'>Notes</FormLabel>
                            <Textarea name="notes" placeholder="Notes" value={values.notes} onChange={handleChange} onBlur={handleBlur} resize='none' borderColor={errors.notes && touched.notes ? "red.300" : null} />
                            {errors.notes && touched.notes && <Text color='red'>{errors.notes}</Text>}
                        </GridItem>

                    </Grid>
                </ModalBody>
                <ModalFooter>
                    <Button size="sm" variant='brand' me={2} onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? <Spinner /> : 'Save'}
                    </Button>
                    <Button size="sm" variant="outline" colorScheme="red" onClick={() => { formik.resetForm(); onClose(); }}>Close</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default AddMeeting;
