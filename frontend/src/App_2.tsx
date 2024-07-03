import { useState, useEffect } from 'react'
import cod3xLogo from './assets/cod3x.jpg'
import './App.css'
import axios from 'axios'

// const config = {
//   API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000'
// }

// const API_URL = "https://api-dot-internal-website-427620.uc.r.appspot.com";

// const api_url = "https://api-dot-internal-website-427620.uc.r.appspot.com";

const api_url = 'http://localhost:8000';

// interface SignedUrlResponse {
//   signedUrl: string;
//   filename: string;
// }

function App() {

  const [csvFiles, setCsvFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);


  const fetchAPI = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching from:', `${api_url}/api/files`);  // Add this line
      const response = await axios.get(`${api_url}/api/files`);
      setCsvFiles(response.data);
      console.log(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAPI();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFile(event.target.value);
    // You can add additional logic here, like fetching file contents
    console.log(`Selected file: ${event.target.value}`);
  };

  const handleDownload = async () => {
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }
  
    setIsDownloading(true);
  
    try {
      const response = await axios.get(`/api/download/${selectedFile}`);
      const { signedUrl, filename } = response.data;

      // Create a temporary anchor element to trigger the download
      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link)

    } catch (error) {
      console.error("Error downloading file:", error);
      alert("An error occurred while downloading the file.");
    } finally {
      setIsDownloading(false);
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
    <h2>Select a CSV File:</h2>
    {isLoading ? (
      <p>Loading...</p>
    ) : csvFiles.length > 0 ? (
      <>
        <select value={selectedFile} onChange={handleFileSelect} className="file-dropdown">
          <option value="">-- Select a file --</option>
          {csvFiles.map((file, index) => (
            <option key={index} value={file}>
              {file}
            </option>
          ))}
        </select>
        <button 
          onClick={handleDownload} 
          disabled={!selectedFile || isDownloading} 
          className={`download-button ${isDownloading ? 'downloading' : ''}`}
        >
          {isDownloading ? 'Downloading...' : 'Download Selected File'}
        </button>
        {isDownloading && <div className="download-animation"></div>}
      </>
    ) : (
      <p>No files found.</p>
    )}
  </div>

    </>
    
  )
}

export default App