import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import aureliusLogo from './assets/aurelius.svg'
import viteLogo from '/vite.svg'
import './App.css'
import axios from 'axios'

function App() {
  const [count, setCount] = useState(0)

  const [csvFiles, setCsvFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);

  const fetchAPI = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("http://127.0.0.1:8000/api/files");
      setCsvFiles(response.data);
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

    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/download/${selectedFile}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', selectedFile);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("An error occurred while downloading the file.");
    }
  };

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={aureliusLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      
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
          <button onClick={handleDownload} disabled={!selectedFile} className="download-button">
            Download Selected File
          </button>
        </>
      ) : (
        <p>No files found.</p>
      )}
    </div>

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
    
  )
}

export default App