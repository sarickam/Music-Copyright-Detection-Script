const express = require('express');
const { processFile } = require('../services/fileUploadService');
const router = express.Router();

router.post('/', async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: 'No files were uploaded.' });
    }

    const audioFile = req.files.audioFile;

    try {
        const result = await processFile(audioFile);
        res.send(`
            <h2>Processing Result</h2>
            <pre>${JSON.stringify(result, null, 2)}</pre>
            <a href="/">Upload another file</a>
        `);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ message: 'Error during processing.', error: err.message });
    }
});

module.exports = router;
