const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const { createUploadsDir } = require('./services/fileUploadService');
const uploadRoute = require('./routes/upload');

const app = express();

// Middleware for file uploads
app.use(fileUpload({ useTempFiles: true, tempFileDir: '/tmp/' })); // Temp files for large uploads
app.use(express.static(path.join(__dirname, 'uploads')));

// Create uploads directory
createUploadsDir();

// Routes
app.use('/upload', uploadRoute); // Mount the upload route

module.exports = app;
