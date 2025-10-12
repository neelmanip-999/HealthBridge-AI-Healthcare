import React from 'react';
import DoctorSearch from './DoctorSearch';
import GPTChat from './GPTChat';

export default function PatientDashboard(){
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Patient Dashboard</h2>
      <div className="grid grid-cols-2 gap-4">
        <div><DoctorSearch/></div>
        <div><GPTChat/></div>
      </div>
    </div>
  );
}
