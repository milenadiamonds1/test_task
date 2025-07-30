import { useEffect, useState, useCallback, useMemo } from 'react';
import { DeleteIcon, ViewIcon, SearchIcon } from '@chakra-ui/icons';
import {
    Button,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Text,
    useDisclosure
} from '@chakra-ui/react';
import { CiMenuKebab } from 'react-icons/ci';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';

import { HasAccess } from '../../../redux/accessUtils';
import CommonCheckTable from '../../../components/reactTable/checktable';
import MeetingAdvanceSearch from './components/MeetingAdvanceSearch';
import AddMeeting from './components/Addmeeting';
import CommonDeleteModel from 'components/commonDeleteModel';
import { deleteManyApi } from 'services/api';
import { fetchMeetingData } from '../../../redux/slices/meetingSlice';

const Index = () => {
    const title = 'Meeting';
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [actionTrigger, setActionTrigger] = useState(false);
    const [selectedValues, setSelectedValues] = useState([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
    const [searchedData, setSearchedData] = useState([]);
    const [displaySearchData, setDisplaySearchData] = useState(false);
    const [searchTags, setSearchTags] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    const [permission] = HasAccess(['Meetings']);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const result = await dispatch(fetchMeetingData());
        if (result.payload.status === 200) {
            setData(result.payload.data);
        } else {
            toast.error('Failed to fetch data');
        }
        setIsLoading(false);
    }, [dispatch]);

    const handleDeleteMeeting = async (ids) => {
        try {
            setIsLoading(true);
            const response = await deleteManyApi('api/meeting/deleteMany', { ids });
            if (response.status === 200) {
                setSelectedValues([]);
                setDeleteDialogOpen(false);
                setActionTrigger((prev) => !prev);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const actionHeader = useMemo(() => ({
        Header: 'Action',
        isSortable: false,
        center: true,
        cell: ({ row }) => (
            <Text fontSize="md" fontWeight="900" textAlign="center">
                <Menu isLazy>
                    <MenuButton><CiMenuKebab /></MenuButton>
                    <MenuList minW='fit-content'>
                        {permission?.view && (
                            <MenuItem
                                py={2.5}
                                color='green'
                                onClick={() => navigate(`/metting/${row?.values._id}`)}
                                icon={<ViewIcon fontSize={15} />}
                            >
                                View
                            </MenuItem>
                        )}
                        {permission?.delete && (
                            <MenuItem
                                py={2.5}
                                color='red'
                                onClick={() => {
                                    setDeleteDialogOpen(true);
                                    setSelectedValues([row?.values?._id]);
                                }}
                                icon={<DeleteIcon fontSize={15} />}
                            >
                                Delete
                            </MenuItem>
                        )}
                    </MenuList>
                </Menu>
            </Text>
        )
    }), [navigate, permission]);

    const tableColumns = useMemo(() => [
        {
            Header: '#',
            accessor: '_id',
            isSortable: false,
            width: 10
        },
        {
            Header: 'Agenda',
            accessor: 'agenda',
            cell: ({ row, value }) => (
                <Link to={`/metting/${row?.values._id}`}>
                    <Text
                        me='10px'
                        sx={{ '&:hover': { color: 'blue.500', textDecoration: 'underline' } }}
                        color='brand.600'
                        fontSize='sm'
                        fontWeight='700'
                    >
                        {value || ' - '}
                    </Text>
                </Link>
            )
        },
        { Header: 'Date & Time', accessor: 'dateTime' },
        { Header: 'Time Stamp', accessor: 'timestamp' },
        {
            Header: 'Created By',
            accessor: (row) => {
                const { firstName, lastName } = row.createBy || {};
                return firstName && lastName ? `${firstName} ${lastName}` : '-';
            }
        },
        ...(permission?.update || permission?.view || permission?.delete ? [actionHeader] : [])
    ], [permission, actionHeader]);

    useEffect(() => {
        fetchData();
    }, [actionTrigger, fetchData]);

    return (
        <div>
            <CommonCheckTable
                title={title}
                isLoding={isLoading}
                columnData={tableColumns}
                allData={data}
                tableData={data}
                searchDisplay={displaySearchData}
                setSearchDisplay={setDisplaySearchData}
                searchedDataOut={searchedData}
                setSearchedDataOut={setSearchedData}
                tableCustomFields={[]}
                access={permission}
                onOpen={onOpen}
                selectedValues={selectedValues}
                setSelectedValues={setSelectedValues}
                setDelete={setDeleteDialogOpen}
                AdvanceSearch={
                    <Button
                        variant='outline'
                        colorScheme='brand'
                        leftIcon={<SearchIcon />}
                        mt={{ sm: '5px', md: '0' }}
                        size='sm'
                        onClick={() => setAdvancedSearchOpen(true)}
                    >
                        Advance Search
                    </Button>
                }
                getTagValuesOutSide={searchTags}
                searchboxOutside={searchQuery}
                setGetTagValuesOutside={setSearchTags}
                setSearchboxOutside={setSearchQuery}
                handleSearchType='MeetingSearch'
            />

            <MeetingAdvanceSearch
                advanceSearch={advancedSearchOpen}
                setAdvanceSearch={setAdvancedSearchOpen}
                setSearchedData={setSearchedData}
                setDisplaySearchData={setDisplaySearchData}
                allData={data}
                setAction={setActionTrigger}
                setGetTagValues={setSearchTags}
                setSearchbox={setSearchQuery}
            />

            <AddMeeting
                setAction={setActionTrigger}
                isOpen={isOpen}
                onClose={onClose}
            />

            <CommonDeleteModel
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                type='Meetings'
                handleDeleteData={handleDeleteMeeting}
                ids={selectedValues}
            />
        </div>
    );
};

export default Index;