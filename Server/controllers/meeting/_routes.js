const express = require('express');
const router = express.Router();
const meetingController = require('../meeting/meeting');
const auth = require('../../middelwares/auth');

router.get('/', auth, meetingController.index);
router.get('/view/:id', auth, meetingController.view);
router.post('/add', auth, meetingController.add);
router.delete('/delete/:id', auth, meetingController.deleteData);
router.post('/deleteMany', auth, meetingController.deleteMany);

module.exports = router;
