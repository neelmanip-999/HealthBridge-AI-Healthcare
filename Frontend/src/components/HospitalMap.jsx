import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import axios from 'axios';

const containerStyle = {
  width: '100%',
  height: '400px'
};

const center = {
  lat: 28.6139, // Default to New Delhi
  lng: 77.209
};

const HospitalMap = () => {
  const [hospitals, setHospitals] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    // Fetch all registered hospitals
    const fetchHospitals = async () => {
      try {
        const response = await axios.get('/api/hospitals/all');
        setHospitals(response.data);
      } catch (error) {
        console.error('Error fetching hospitals:', error);
      }
    };

    fetchHospitals();
  }, []);

  const handleMapClick = (event) => {
    setSelectedLocation({
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    });
  };

  const handleAddHospital = async () => {
    const name = prompt('Enter hospital name:');
    if (!name || !selectedLocation) return;

    try {
      await axios.post('/api/hospitals/add', {
        name,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng
      });
      alert('Hospital added successfully!');
      setSelectedLocation(null);
    } catch (error) {
      console.error('Error adding hospital:', error);
      alert('Failed to add hospital.');
    }
  };

  return (
    <div>
      <h2>Hospital Map</h2>
      <LoadScript googleMapsApiKey="AIzaSyD7Vw4BlccSY7Y677v599yhYC7heGWi65s">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={10}
          onClick={handleMapClick}
        >
          {hospitals.map((hospital, index) => (
            <Marker
              key={index}
              position={{ lat: hospital.location.coordinates[1], lng: hospital.location.coordinates[0] }}
              title={hospital.name}
            />
          ))}

          {selectedLocation && (
            <Marker
              position={selectedLocation}
              onClick={handleAddHospital}
              label="New Hospital"
            />
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default HospitalMap;