# Audio Upload API (Serverless)

This project provides a serverless API for uploading and processing audio files using a Node.js (Express) backend. The API uses a Python script to analyze uploaded audio files and stores relevant information in a PostgreSQL database. The project is set up to deploy on AWS Lambda using the Serverless Framework.

## Features

- **Audio File Upload**: Upload audio files via an HTML form.
- **Audio Processing**: A Python script processes the audio file.
- **Database Storage**: PostgreSQL is used to store metadata about the processed audio files.
- **Serverless Architecture**: The application is deployed on AWS Lambda using the Serverless Framework.
- **File Handling**: Files are uploaded and stored temporarily on the server, and results are displayed to the user after processing.

## Project Structure

```bash
.
├── handler.js               # Main serverless handler
├── server.js                # Express app
├── routes
│   └── upload.js            # Upload route logic
├── services
│   └── fileUploadService.js # File upload and processing logic
├── utils
│   └── db.js                # PostgreSQL connection pool
├── uploads                  # Directory for uploaded files
├── script.py                # Python script for audio processing
├── serverless.yml           # Serverless framework config
├── package.json             # Project dependencies
├── .env                     # Environment variables
└── README.md                # Project documentation

## Database

create Database in postgres musicdb then run below query to create table


CREATE TABLE songs (
    song_id SERIAL PRIMARY KEY,                -- Auto-incrementing unique ID for each song
    song_name VARCHAR(255) NOT NULL,           -- Name of the song
    audio_data BYTEA NOT NULL,                 -- Binary data of the uploaded audio file
    mfcc JSONB NOT NULL,                       -- MFCC features stored as JSON
    chroma JSONB NOT NULL,                     -- Chroma features stored as JSON
    spectral_contrast JSONB NOT NULL,          -- Spectral contrast features stored as JSON
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Timestamp of when the song was added
);


-----Prerequisites
    Node.js (v18.x or higher)
    AWS CLI
    Serverless Framework
    Python 3.x
    PostgreSQL Database

git clone https://github.com/sarickam/Music_Copyright_Detection_Script.git
cd audio-upload-api


=> npm install

=> Create a .env file in the root of the project with the following content:

PG_USER=your_postgres_user
PG_PASSWORD=your_postgres_password
PG_HOST=your_postgres_host
PG_DATABASE=your_database_name
PG_PORT=5432


=> Ensure that your AWS credentials are configured on your machine. You can use the AWS CLI for this:

aws configure


=> Deploy the serverless application:

serverless deploy


=> If you want to run the project locally for testing purposes, use the following command:

serverless offline


Visit http://localhost:3000 in your browser to use the audio upload interface.




========================================================================================================>

Database Setup
Make sure your PostgreSQL database is set up correctly and accessible using the credentials in the .env file. You can create a basic songs table to store the results from the Python processing script:

CREATE TABLE songs (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    result JSONB NOT NULL,
    date_created TIMESTAMP DEFAULT NOW()
);


--File Upload Service
    All file upload and processing logic is handled by fileUploadService.js in the services folder. The service handles:

--File upload
    Running the Python script
    Saving the result to the database

--Contributing
    Feel free to open issues or submit pull requests if you'd like to contribute to this project.

--License
    This project is open-source and licensed under the MIT License.
```
