import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HospitalMap from './components/HospitalMap';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/hospitals" element={<HospitalMap />} />
          {/* ...other routes... */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;