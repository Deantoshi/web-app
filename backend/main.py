from flask import Flask, send_from_directory, send_file, make_response, jsonify, url_for, Response, stream_with_context
from flask_cors import CORS
import os
from google.cloud import storage
from google.cloud.exceptions import NotFound
from google.auth import default
from google.oauth2 import service_account
import pandas as pd
import io
import logging
import time
import zipfile
import datetime

# logging.basicConfig(level=logging.DEBUG)
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')



KEYWORDS = ['aurelius', 'metis', 'ironclad', 'optimism', 'icl']

app = Flask(__name__)
# cors = CORS(app, origins='*')
CORS(app, resources={r"/api/*": {"origins": "https://frontend-dot-internal-website-427620.uc.r.appspot.com"}})

# Initialize GCP storage client
credentials, project = default()
storage_client = storage.Client(credentials=credentials, project=project)

@app.route('/api/data')
def get_data():
    return {"message": "Hello from Flask!"}

# Serve React App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/files')
def get_files():
    bucket_name = 'cooldowns2'
    bucket = storage_client.get_bucket(bucket_name)
    blobs = bucket.list_blobs()
    
    csv_files = [blob.name for blob in blobs 
                 if blob.name.endswith('.zip')
                 and any(keyword.lower() in blob.name.lower() for keyword in KEYWORDS)]

    return jsonify(csv_files)

@app.route('/api/file/<filename>')
def get_file_content(filename):
    bucket_name = 'cooldowns2'
    bucket = storage_client.get_bucket(bucket_name)
    blob = bucket.blob(filename)
    
    content = blob.download_as_string()
    df = pd.read_csv(io.BytesIO(content))
    return jsonify(df.to_dict(orient='records'))

# Function to get credentials
def get_credentials():
    if os.environ.get('GOOGLE_APPLICATION_CREDENTIALS'):
        # Running on App Engine
        return None  # Default credentials will be used
    else:
        # Running locally
        key_path = 'fast-web-419215-35d284e06546.json'  # Update this path
        return service_account.Credentials.from_service_account_file(key_path)

@app.route('/api/download/<filename>')
def download_file(filename):
    bucket_name = 'cooldowns2'
    credentials = get_credentials()
    storage_client = storage.Client(credentials=credentials)
    
    try:
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(filename)

        if not blob.exists():
            logging.warning(f"File not found in bucket: {filename}")
            return jsonify({"error": f"File {filename} not found in bucket {bucket_name}"}), 404

        logging.info(f"Generating signed URL for file: {filename}")
        
        url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(minutes=15),
            method="GET",
            service_account_email=credentials.service_account_email if credentials else None,
            access_token=credentials.token if credentials else None,
        )
        
        logging.info(f"Signed URL generated for: {filename}")
        
        return jsonify({
            "signedUrl": url,
            "filename": filename
        }), 200

    except Exception as e:
        logging.exception(f"Error generating signed URL for {filename}: {str(e)}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@app.route('/api/files/<filename>/url')
def get_signed_url(filename):
    # Code to generate a signed URL for the specified file
    storage_client = storage.Client()
    bucket = storage_client.bucket('cooldowns2')
    blob = bucket.blob(filename)
    url = blob.generate_signed_url(expiration=900)  # 15 minutes
    return jsonify({"filename": filename, "signedUrl": url})

if __name__ == '__main__':
    app.run(use_reloader=True, port=8000, threaded=True, DEBUG=True)
