const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const pool = require('../utils/db');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
const createUploadsDir = () => {
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
    }
};

// Process the uploaded file
const processFile = (audioFile) => {
    return new Promise(async (resolve, reject) => {
        const filePath = path.join(uploadsDir, audioFile.name);
        try {
            await audioFile.mv(filePath); // Save the file

            // Call Python script to process the file
            const result = await runPythonScript(filePath);

            // Insert result into PostgreSQL database
            const insertQuery = `INSERT INTO songs (file_name, result, date_created) VALUES ($1, $2, NOW())`;
            await pool.query(insertQuery, [audioFile.name, JSON.stringify(result)]);

            resolve(result);
        } catch (err) {
            reject(err);
        }
    });
};

// Helper function to run the Python script
const runPythonScript = (filePath) => {
    return new Promise((resolve, reject) => {
        const pythonScriptPath = path.join(__dirname, '..', 'script.py');
        exec(`python3 "${pythonScriptPath}" "${filePath}"`, (error, stdout, stderr) => {
            if (error) {
                return reject(new Error(`Error executing script: ${error.message}`));
            }
            try {
                const result = JSON.parse(stdout); // Assuming script outputs JSON
                resolve(result);
            } catch (err) {
                reject(new Error(`Failed to parse JSON: ${err.message}`));
            }
        });
    });
};

module.exports = {
    createUploadsDir,
    processFile,
};
