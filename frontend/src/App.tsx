import React, { useState, useEffect } from 'react';
import cod3xLogo from './assets/cod3x.jpg';
import './App.css';
import axios from 'axios';
import TokenRevenuePieChart from './TokenRevenuePieChart';
import RevenueCards from './RevenueCards';
import DeploymentRevenueChart from './DeploymentRevenueChart';
import SevenDayMARevenueChart from './SevenDayMARevenueChart';
import ThirtyDayMARevenueChart from './ThirtyDayMARevenueChart';
import NinetyDayMARevenueChart from './NinetyDayMARevenueChart';
import OneEightyDayMARevenueChart from './OneEightyDayMARevenueChart';
import RevenueByTypeChart from './RevenueByTypeChart';
import RewarderDataDisplay from './RewarderDataDisplay';
import LoadingAnimation from './LoadingAnimation';

const api_url = "https://frontend-dot-internal-website-427620.uc.r.appspot.com";

interface FileData {
  filename: string;
  signedUrl: string;
}

function App() {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

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

  const handleFilteredDownload = async (includeRevenue: boolean) => {
    const filesToDownload = files.filter(file => 
      includeRevenue ? file.toLowerCase().includes('revenue') : !file.toLowerCase().includes('revenue')
    );

    if (filesToDownload.length === 0) {
      alert(`No ${includeRevenue ? 'revenue' : 'non-revenue'} files found.`);
      return;
    }

    setIsDownloadingAll(true);
    try {
      for (const file of filesToDownload) {
        const response = await axios.get<FileData>(`${api_url}/api/download/${file}`);
        const { signedUrl } = response.data;
        
        const link = document.createElement('a');
        link.href = signedUrl;
        link.setAttribute('download', file);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Error downloading files:', error);
      alert('Failed to download files. Please try again.');
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'summary':
        return (
          <div className="summary-content">
            <section className="file-downloader">
              <h2 className="centered-text">Select a file to download:</h2>
              {isLoadingFiles ? (
                <p className='centered-text'>Loading files...</p>
              ) : (
                <div className="download-container">
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
                  <div className="download-all-buttons">
                    <button 
                      className={`download-revenue-button ${isDownloadingAll ? 'downloading' : ''}`}
                      onClick={() => handleFilteredDownload(true)} 
                      disabled={files.length === 0 || isLoading || isDownloadingAll}
                    >
                      Download All Revenue Files
                    </button>
                    <button 
                      className={`download-non-revenue-button ${isDownloadingAll ? 'downloading' : ''}`}
                      onClick={() => handleFilteredDownload(false)} 
                      disabled={files.length === 0 || isLoading || isDownloadingAll}
                    >
                      Download All Non-Revenue Files
                    </button>
                  </div>
                  {/* {(isLoading || isDownloadingAll) && <LoadingAnimation />} */}
                </div>
              )}
            </section>
            <h2>Top Line Revenue Goals</h2>
            <div className="centered-cards">
              <RevenueCards />
            </div>
            <h2>RF Revenue by Token</h2>
            <TokenRevenuePieChart />
            <h2>Cumulative Deployment Revenue</h2>
            <DeploymentRevenueChart />
            <h2>Cumulative Revenue by Source</h2>
            <RevenueByTypeChart />
          </div>
        );
      case 'movingAverages':
        return (
          <>
            <h2 className="centered-text">7 Day MA Revenue Per Deployment</h2>
            <SevenDayMARevenueChart />
            <h2 className="centered-text">30 Day MA Revenue Per Deployment</h2>
            <ThirtyDayMARevenueChart />
            <h2 className="centered-text">90 Day MA Revenue Per Deployment</h2>
            <NinetyDayMARevenueChart />
            <h2 className="centered-text">180 Day MA Revenue Per Deployment</h2>
            <OneEightyDayMARevenueChart />
          </>
        );
      case 'rewarderTracker':
        return (
          <div className="rewarder-tracker-content">
            <RewarderDataDisplay />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
    <div className="app-container">
      <aside className="sidebar sticky">
        <div className="sidebar-content">
          <div className="logo-container">
            <a href="https://www.cod3x.org/" target="_blank" rel="noopener noreferrer">
              <img src={cod3xLogo} className="logo cod3x-logo" alt="Cod3x logo" />
            </a>
          </div>
          <nav className="sidebar-navigation">
            <button onClick={() => setActiveTab('summary')} className={activeTab === 'summary' ? 'active' : ''}>Summary</button>
            <button onClick={() => setActiveTab('movingAverages')} className={activeTab === 'movingAverages' ? 'active' : ''}>Moving Averages</button>
            <button onClick={() => setActiveTab('rewarderTracker')} className={activeTab === 'rewarderTracker' ? 'active' : ''}>Rewarder Tracker</button>
          </nav>
        </div>
      </aside>

      <main className="main-content">
        <header>
          <h1 className="centered-text">MRP Hub</h1>
        </header>

        <section className="chart-display">
        <h2 className="centered-text uppercase">{activeTab.split(/(?=[A-Z])/).join(' ')}</h2>
          {renderContent()}
        </section>
      </main>
    </div>
    {(isLoading || isDownloadingAll) && <LoadingAnimation />}
    </>
  );
}

export default App;