// App.tsx (or FileDownloader.tsx)
import { useState, useEffect } from 'react'
import cod3xLogo from './assets/cod3x.jpg'
import './App.css'
import axios from 'axios'
import RevenueChart from './RevenueChart';
import TokenRevenuePieChart from './TokenRevenuePieChart';
import RevenueCards from './RevenueCards';
import DeploymentRevenueChart from './DeploymentRevenueChart';

const api_url = 'http://localhost:8000';

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
        
        const link = document.createElement('a');
        link.href = signedUrl;
        link.setAttribute('download', selectedFile);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
        <h2>Select a file to download:</h2>
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
      <h2>Revenue Summary Data</h2>
      <div className="App">
        <RevenueCards />
      </div>
      <h2>Revenue Charts</h2>
      <h3>Revenue Per Token</h3>
      <div>
        <TokenRevenuePieChart />
      </div>
      <h2>Cumulative Revenue Per Deployment</h2>
      <div>
        <DeploymentRevenueChart />
      </div>
      <div>
      <RevenueChart />
      </div>
    </>
  );
}

export default FileDownloader;