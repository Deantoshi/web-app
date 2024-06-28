from flask import Flask, send_from_directory, send_file, make_response, jsonify, url_for
from flask_cors import CORS
import os
from google.cloud import storage
import pandas as pd
import io

app = Flask(__name__)
cors = CORS(app, origins='*')

# Initialize GCP storage client
storage_client = storage.Client()

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
    
    csv_files = [blob.name for blob in blobs if blob.name.endswith('.csv')]
    return jsonify(csv_files)

@app.route('/api/file/<filename>')
def get_file_content(filename):
    bucket_name = 'cooldowns2'
    bucket = storage_client.get_bucket(bucket_name)
    blob = bucket.blob(filename)
    
    content = blob.download_as_string()
    df = pd.read_csv(io.BytesIO(content))
    return jsonify(df.to_dict(orient='records'))

@app.route('/api/download/<filename>')
def download_file(filename):
    bucket_name = 'cooldowns2'
    storage_client = storage.Client()
    bucket = storage_client.get_bucket(bucket_name)
    blob = bucket.blob(filename)
    
    if blob.exists():
        content = blob.download_as_bytes()
        return send_file(
            io.BytesIO(content),
            mimetype='text/csv',
            as_attachment=True,
            download_name=filename  # Changed from attachment_filename to download_name
        )
    else:
        return "File not found", 404

if __name__ == '__main__':
    app.run(use_reloader=True, port=8000, threaded=True)
