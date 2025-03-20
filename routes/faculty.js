const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadResults, uploadDocuments } = require('../controllers/facultyController');

router.post('/results/upload', authMiddleware(['faculty']), uploadResults);
router.post('/documents/upload', authMiddleware(['faculty']), upload.single('file'), uploadDocuments);

module.exports = router;