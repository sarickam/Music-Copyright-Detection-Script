const express = require('express');
const fileUpload = require('express-fileupload');
const { exec } = require('child_process');
const path = require('path');
const { Pool } = require('pg');
const fs = require('fs');

const app = express();
const port = 3000;

// PostgreSQL connection pool
const pool = new Pool({
    host: process.env.PG_HOST,          // Host from environment variables
    user: process.env.PG_USER,          // User from environment variables
    password: process.env.PG_PASSWORD,   // Password from environment variables
    database: process.env.PG_DATABASE,   // Database from environment variables
    port: process.env.PG_PORT || 5432,   // Port, default to 5432
    max: 10,                              // Max number of clients
    idleTimeoutMillis: 30000,            // Idle timeout
    connectionTimeoutMillis: 2000,       // Connection timeout
});

// Middleware for file uploads
app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'uploads'))); // Serve uploads statically

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Root route to serve the upload form
app.get('/', (req, res) => {
    res.send(`
        <h2>Upload a Music File</h2>
        <form ref='uploadForm'
            id='uploadForm'
            action='/upload'
            method='post'
            encType='multipart/form-data'>
              <input type="file" name="audioFile" accept="audio/*" required/>
              <input type='submit' value='Upload!' />
        </form>
    `);
});

// Endpoint to handle file upload
app.post('/upload', async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: 'No files were uploaded.' });
    }

    const audioFile = req.files.audioFile;
    const filePath = path.join(uploadsDir, audioFile.name);

    // Save the uploaded file to the server
    try {
        await audioFile.mv(filePath);
    } catch (err) {
        console.error('File upload failed:', err);
        return res.status(500).json({ message: 'File upload failed.', error: err.message });
    }

    // Execute the Python script
    const pythonScriptPath = path.join(__dirname, 'script.py');
    exec(`C:\\Python312\\python.exe "${pythonScriptPath}" "${filePath}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing script: ${error.message}`);
            return res.status(500).json({ message: 'Error during processing.', error: error.message });
        }

        let result;
        try {
            result = JSON.parse(stdout); // Assuming script outputs JSON
        } catch (err) {
            console.error(`Failed to parse JSON: ${err.message}`);
            return res.status(500).json({ message: 'Error parsing results.', error: err.message });
        }

        // Send result back to the client in a readable format
        res.send(`
            <h2>Processing Result</h2>
            <pre>${JSON.stringify(result, null, 2)}</pre>
            <a href="/">Upload another file</a>
        `);
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
