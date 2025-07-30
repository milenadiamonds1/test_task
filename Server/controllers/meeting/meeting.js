const Meeting = require('../../model/schema/meeting');

const add = async (req, res) => {
    try {
        const meeting = new Meeting(req.body);
        const saved = await meeting.save();
        res.status(201).json(saved);
    } catch (error) {
        res.status(500).json({ message: 'Adding meeting failed.', error });
    }
};

const index = async (req, res) => {
    try {
        const meetings = await Meeting.find({ deleted: false }).populate({path: 'createBy', select: 'firstName lastName', match:{deleted:false}}).exec()

        res.json(meetings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching meetings.', error });
    }
};

const view = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id)
            .populate({path: 'attendees', select: 'fullName', match:{deleted:false}})
            .populate({path: 'createBy', select: 'firstName lastName', match:{deleted:false}}).exec();


        if (!meeting || meeting.deleted) {
            return res.status(404).json({ message: 'Meeting not found.' });
        }

        res.json(meeting);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving meeting', error });
    }
};

const deleteData = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);
        if (!meeting) return res.status(404).json({ message: 'Meeting not found.' });

        meeting.deleted = true;
        await meeting.save();

        res.json({ message: 'Meeting marked as deleted.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting meeting.', error });
    }
};

const deleteMany = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || !ids.length) {
            return res.status(400).json({ message: 'No IDs provided' });
        }

        await Meeting.updateMany(
            { _id: { $in: ids } },
            { $set: { deleted: true } }
        );

        res.json({ message: 'Meetings marked as deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting meetings', error });
    }
};

module.exports = {
    add,
    index,
    view,
    deleteData,
    deleteMany,
};
