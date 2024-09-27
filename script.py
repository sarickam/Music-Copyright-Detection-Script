import librosa
import sys
import json
import psycopg2
import psycopg2.extras 
import numpy as np
from pydub import AudioSegment
import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

def init_db():
    """Initialize database connection."""
    try:
        return psycopg2.connect(
            host=os.getenv('PG_HOST'),
            user=os.getenv('PG_USER'),
            password=os.getenv('PG_PASSWORD'),
            database=os.getenv('PG_DATABASE'),
            port=os.getenv('PG_PORT', 5432)
        )
    except Exception as e:
        print("Failed to connect to the database:", e)
        sys.exit(1) 

def store_song_data(db, song_data, audio_file_path):
    """Store song data and audio in the database."""
    cursor = db.cursor()
    try:
        # Read the audio file in binary mode
        with open(audio_file_path, 'rb') as audio_file:
            audio_data = audio_file.read()
            
        cursor.execute(
            "INSERT INTO songs (song_name, audio_data, mfcc, chroma, spectral_contrast) VALUES (%s, %s, %s, %s, %s)",
            (song_data['song_name'], psycopg2.Binary(audio_data), json.dumps(song_data['mfcc']),
             json.dumps(song_data['chroma']), json.dumps(song_data['spectral_contrast']))
        )
        db.commit()
    except psycopg2.Error as err:
        print(json.dumps({"error": str(err)}))
    finally:
        cursor.close()


def convert_audio_to_wav(file_path):
    """Convert any audio file to wav using pydub."""
    audio = AudioSegment.from_file(file_path)
    wav_file_path = file_path.replace(file_path.split('.')[-1], 'wav')
    audio.export(wav_file_path, format="wav")
    return wav_file_path

def analyze_song(file_path):
    """Analyze the song and return its features."""
    # Convert the file to WAV for librosa processing if necessary
    if not file_path.endswith('.wav'):
        file_path = convert_audio_to_wav(file_path)

    # Load the music file using librosa
    try:
        y, sr = librosa.load(file_path, sr=None)

        # Extract MFCCs
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13).mean(axis=1).tolist()

        # Extract Chroma Feature
        chroma = librosa.feature.chroma_stft(y=y, sr=sr).mean(axis=1).tolist()

        # Extract Spectral Contrast
        spectral_contrast = librosa.feature.spectral_contrast(y=y, sr=sr).mean(axis=1).tolist()

        # Prepare results
        song_data = {
            "song_name": file_path.split('/')[-1],
            "mfcc": mfcc,
            "chroma": chroma,
            "spectral_contrast": spectral_contrast
        }
        
        return song_data
    
    except Exception as e:
        print(json.dumps({"error": f"Failed to process song: {str(e)}"}))
        return None

def normalize_vector(vector):
    """Normalize a vector to have unit norm (for better similarity comparison)."""
    norm = np.linalg.norm(vector)
    if norm == 0: 
        return vector
    return vector / norm

def calculate_similarity(song1, song2):
    """Calculate similarity between two songs based on normalized features."""
    # Normalize the feature vectors
    mfcc_similarity = np.corrcoef(normalize_vector(song1['mfcc']), normalize_vector(song2['mfcc']))[0, 1]
    chroma_similarity = np.corrcoef(normalize_vector(song1['chroma']), normalize_vector(song2['chroma']))[0, 1]
    spectral_similarity = np.corrcoef(normalize_vector(song1['spectral_contrast']), normalize_vector(song2['spectral_contrast']))[0, 1]

    # Average the similarity metrics to get an overall similarity score
    overall_similarity = (mfcc_similarity + chroma_similarity + spectral_similarity) / 3 * 100
    return overall_similarity

def calculate_match_percentage(db, new_song_data):
    """Calculate match percentage with existing songs in the database."""
    cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute("SELECT song_name, mfcc, chroma, spectral_contrast FROM songs")
    existing_songs = cursor.fetchall()

    for song in existing_songs:
        # Check if the values are already lists
        if isinstance(song['mfcc'], str):
            song['mfcc'] = json.loads(song['mfcc'])
        if isinstance(song['chroma'], str):
            song['chroma'] = json.loads(song['chroma'])
        if isinstance(song['spectral_contrast'], str):
            song['spectral_contrast'] = json.loads(song['spectral_contrast'])

        match_percentage = calculate_similarity(new_song_data, song)

        if match_percentage >= 80:
            cursor.close()
            return match_percentage  # Copyright detected

    cursor.close()
    return 0  # No match


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
        sys.exit(1)

    # Get the file path from the command line argument
    audio_file_path = sys.argv[1]

    # Initialize the database
    db = init_db()

    # Analyze the song
    song_data = analyze_song(audio_file_path)
    if song_data is None:
        db.close()
        sys.exit(1)

    # Check for copyright match
    match_percentage = calculate_match_percentage(db, song_data)

    # Ensure the match percentage and song data are serializable
    try:
        match_percentage = float(match_percentage)  # Ensure match_percentage is a float
        song_data_serializable = {
            key: value if isinstance(value, (str, list, int, float)) else str(value)
            for key, value in song_data.items()
        }
    except Exception as e:
        print(json.dumps({"error": f"Serialization error: {str(e)}"}))
        db.close()
        sys.exit(1)

    # Store the new song data if there's no copyright match
    if match_percentage < 70:
        store_song_data(db, song_data_serializable, audio_file_path)

    # Prepare output
    output = {
        "match_percentage": match_percentage,
        "is_copyrighted": match_percentage >= 70,
        "song_data": song_data_serializable  # Ensure song_data is JSON serializable
    }

    # Print the output as JSON
    try:
        print(json.dumps(output))  # This should now serialize correctly
    except TypeError as e:
        print(json.dumps({"error": f"Failed to serialize output: {str(e)}"}))

    # Close the database connection
    db.close()
