import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CSVViewer() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');

  useEffect(() => {
    axios.get('/api/files')
      .then(response => {
        setFiles(response.data);
      })
      .catch(error => console.error('Error fetching files:', error));
  }, []);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.value);
  };

  const handleDownload = () => {
    if (selectedFile) {
      window.location.href = `/download/${selectedFile}`;
    }
  };

  return (
    <div>
      <h2>CSV File Downloader</h2>
      <select value={selectedFile} onChange={handleFileChange}>
        <option value="">Select a file</option>
        {files.map((file, index) => (
          <option key={index} value={file}>{file}</option>
        ))}
      </select>
      <button onClick={handleDownload} disabled={!selectedFile}>Download</button>
    </div>
  );
}

export default CSVViewer;