const Result = require('../models/Result');
const Document = require('../models/Document');

exports.uploadResults = async (req, res) => {
  const { rollNumber, semester, subjects, totalMarks } = req.body;
  try {
    const result = new Result({ rollNumber, semester, subjects, totalMarks });
    await result.save();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.uploadDocuments = async (req, res) => {
  const { type, semester } = req.body;
  const fileUrl = req.file ? `/uploads/${req.file.filename}` : req.body.fileUrl;
  try {
    const document = new Document({ type, semester, fileUrl });
    await document.save();
    res.json({ success: true, data: document });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};