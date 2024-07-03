import { useState, useEffect } from 'react'
import cod3xLogo from './assets/cod3x.jpg'
import './App.css'
import axios from 'axios'

// const config = {
//   API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000'
// }

// const API_URL = "https://api-dot-internal-website-427620.uc.r.appspot.com";

const api_url = "https://api-dot-internal-website-427620.uc.r.appspot.com";

// const api_url = 'http://localhost:8000';

interface FileData {
  filename: string;
  signedUrl: string;
}

function FileDownloader() {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);

  useEffect(() => {
    setIsLoadingFiles(true);
    axios.get<string[]>(`${api_url}/api/files`)
      .then(response => {
        setFiles(response.data);
      })
      .catch(error => {
        console.error('Error fetching files:', error);
      })
      .finally(() => {
        setIsLoadingFiles(false);
      });
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFile(event.target.value);
  };

  const handleDownload = async () => {
    if (selectedFile) {
      setIsLoading(true);
      try {
        const response = await axios.get<FileData>(`${api_url}/api/download/${selectedFile}`);
        const { signedUrl } = response.data;
        
        // Create a temporary anchor element
        const link = document.createElement('a');
        link.href = signedUrl;
        link.setAttribute('download', selectedFile); // Set the filename
        document.body.appendChild(link);
        link.click(); // Programmatically click the link to start the download
        document.body.removeChild(link); // Clean up
      } catch (error) {
        console.error('Error fetching signed URL:', error);
        alert('Failed to initiate download. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
    <div>
    <a href="https://www.cod3x.org/" target="_blank">
      <img src={cod3xLogo} className="logo cod3x-logo" alt="Cod3x logo" />
    </a>
  </div>
  <h1>MRP Hub</h1>

    <div className="file-dropdown-container">
      <h1>Select a file to download:</h1>
      {isLoadingFiles ? (
        <p>Loading files...</p>
      ) : (
        <>
          <select 
            className="file-dropdown"
            value={selectedFile} 
            onChange={handleFileSelect}
            disabled={isLoading}
          >
            <option value="">Select a file</option>
            {files.map(file => (
              <option key={file} value={file}>
                {file}
              </option>
            ))}
          </select>
          <button 
            className={`download-button ${isLoading ? 'downloading' : ''}`}
            onClick={handleDownload} 
            disabled={!selectedFile || isLoading}
          >
            {isLoading ? 'Initiating Download...' : 'Download'}
          </button>
          {isLoading && <div className="download-animation"></div>}
        </>
      )}
    </div>
    </>
  );
}

export default FileDownloader;