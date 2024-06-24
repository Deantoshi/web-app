import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CSVViewer from './FileDownloader';

function App() {

  return (
    <div className="App">
      <h1>My Web App</h1>
      <CSVViewer />
    </div>
  );
}

export default App;