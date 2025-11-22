import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Save, Trash2, Navigation } from 'lucide-react';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MapPage = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [userCoords, setUserCoords] = useState(null);
  const [destination, setDestination] = useState('');
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [savedLocations, setSavedLocations] = useState([]);
  const [saveName, setSaveName] = useState('');
  const [lastSearchedCoords, setLastSearchedCoords] = useState(null);
  const [showSaveSearched, setShowSaveSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const userMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const routeLayerRef = useRef(null);

  const GRAPH_HOPPER_API_KEY = "ca1da5c3-bd8e-4621-a0e3-86bcae970b08";
  const STORAGE_KEY = "healthbridge_saved_locations_v1";

  // Initialize map
  useEffect(() => {
    if (mapInstanceRef.current) return;

    // Wait for the map container to be available
    const initMap = () => {
      if (!mapRef.current) {
        setTimeout(initMap, 100);
        return;
      }

      // Initialize map with default center (India)
      const map = L.map(mapRef.current, {
        zoomControl: true,
      }).setView([20.5937, 78.9629], 5);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Trigger a resize to ensure map renders correctly
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 100);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map view when user location changes
  useEffect(() => {
    if (userCoords && mapInstanceRef.current) {
      mapInstanceRef.current.setView(userCoords, 14);
      mapInstanceRef.current.invalidateSize();

      // Update or create user marker
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng(userCoords);
      } else {
        userMarkerRef.current = L.marker(userCoords)
          .addTo(mapInstanceRef.current)
          .bindPopup('Your Location')
          .openPopup();
      }
    }
  }, [userCoords]);

  // Update destination marker
  useEffect(() => {
    if (destCoords && mapInstanceRef.current) {
      if (destMarkerRef.current) {
        destMarkerRef.current.setLatLng(destCoords);
      } else {
        destMarkerRef.current = L.marker(destCoords)
          .addTo(mapInstanceRef.current)
          .bindPopup('Destination')
          .openPopup();
      }
    }
  }, [destCoords]);

  // Update route polyline
  useEffect(() => {
    if (routeCoords.length > 0 && mapInstanceRef.current) {
      if (routeLayerRef.current) {
        mapInstanceRef.current.removeLayer(routeLayerRef.current);
      }
      routeLayerRef.current = L.polyline(routeCoords, { color: 'blue', weight: 5 })
        .addTo(mapInstanceRef.current);
      
      if (userCoords && destCoords) {
        mapInstanceRef.current.fitBounds([userCoords, destCoords], { padding: [50, 50] });
      }
    }
  }, [routeCoords, userCoords, destCoords]);

  // Load saved locations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSavedLocations(JSON.parse(saved));
    }
  }, []);

  // Get user's current location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.watchPosition(
        (pos) => {
          setUserCoords([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.error('Location error:', err);
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Handle window resize to update map size
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        setTimeout(() => {
          mapInstanceRef.current.invalidateSize();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save locations to localStorage
  const saveLocations = (locations) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
    setSavedLocations(locations);
  };

  // Geocode function using Nominatim
  const geocode = async (query) => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding failed');
    return res.json();
  };

  // Find route using coordinates
  const findRouteUsingCoords = async (dest) => {
    if (!userCoords) {
      alert('Waiting for your location...');
      return;
    }

    setIsLoading(true);
    setDestCoords(dest);

    const url = `https://graphhopper.com/api/1/route?point=${userCoords[0]},${userCoords[1]}&point=${dest[0]},${dest[1]}&profile=car&points_encoded=false&calc_points=true&locale=en&key=${GRAPH_HOPPER_API_KEY}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.paths && data.paths[0]) {
        const route = data.paths[0];
        const coords = route.points.coordinates.map((c) => [c[1], c[0]]);
        setRouteCoords(coords);
        setRouteInfo({
          distance: (route.distance / 1000).toFixed(2),
          duration: (route.time / 60000).toFixed(1),
        });
      } else {
        throw new Error('No route found');
      }
    } catch (error) {
      console.error('Route error:', error);
      setRouteInfo({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search and route finding
  const handleFindRoute = async () => {
    if (!destination.trim()) {
      alert('Enter destination!');
      return;
    }
    if (!userCoords) {
      alert('Waiting for your location...');
      return;
    }

    setIsLoading(true);
    setRouteInfo({ message: 'Searching...' });

    try {
      const data = await geocode(destination);
      if (!data.length) throw new Error('Location not found');

      const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      setLastSearchedCoords(coords);
      setShowSaveSearched(true);
      await findRouteUsingCoords(coords);
    } catch (error) {
      console.error('Search error:', error);
      setRouteInfo({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Save searched destination
  const handleSaveSearched = () => {
    if (!lastSearchedCoords) return;
    const name = prompt('Enter a name for this destination:', destination);
    if (!name) return;

    const newLocation = {
      name,
      coords: lastSearchedCoords,
      savedAt: new Date().toISOString(),
    };

    const updated = [newLocation, ...savedLocations];
    saveLocations(updated);
    setShowSaveSearched(false);
  };

  // Save current location
  const handleSaveCurrent = () => {
    if (!userCoords) {
      alert('Waiting for your location...');
      return;
    }

    const name = saveName.trim() || `Location ${new Date().toLocaleString()}`;
    const newLocation = {
      name,
      coords: userCoords,
      savedAt: new Date().toISOString(),
    };

    const updated = [newLocation, ...savedLocations];
    saveLocations(updated);
    setSaveName('');
  };

  // Delete saved location
  const handleDeleteLocation = (index) => {
    const updated = savedLocations.filter((_, i) => i !== index);
    saveLocations(updated);
  };

  // Clear all locations
  const handleClearAll = () => {
    if (window.confirm('Delete all saved locations?')) {
      saveLocations([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative">
      {/* Header */}
      <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-4 flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Route Finder</h1>
      </div>

      {/* Map Container */}
      <div className="h-screen w-full relative">
        <div 
          ref={mapRef} 
          style={{ 
            height: '100%', 
            width: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1
          }} 
        />
        {!userCoords && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Getting your location...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls Panel */}
      <div className="absolute top-20 left-4 z-[2000] w-80 max-w-[calc(100%-2rem)] bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-4 space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
        {/* Destination Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFindRoute()}
              placeholder="Search destination (e.g. Taj Mahal)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleFindRoute}
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
          {showSaveSearched && (
            <button
              onClick={handleSaveSearched}
              className="mt-2 w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Save className="w-4 h-4 inline mr-2" />
              Save This Destination
            </button>
          )}
        </div>

        {/* Route Info */}
        {routeInfo && (
          <div className="bg-blue-50 p-3 rounded-lg">
            {routeInfo.error ? (
              <p className="text-red-600 text-sm">Error: {routeInfo.error}</p>
            ) : routeInfo.message ? (
              <p className="text-blue-600 text-sm">{routeInfo.message}</p>
            ) : (
              <div className="text-sm">
                <p>
                  <span className="font-semibold">Distance:</span> {routeInfo.distance} km
                </p>
                <p>
                  <span className="font-semibold">Duration:</span> {routeInfo.duration} min
                </p>
              </div>
            )}
          </div>
        )}

        <hr className="border-gray-300" />

        {/* Save Current Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Save current location
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Name for this location"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSaveCurrent}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Save className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Saved Locations */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-800">Saved Locations</h3>
            {savedLocations.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Clear All
              </button>
            )}
          </div>
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {savedLocations.length === 0 ? (
              <li className="text-sm text-gray-500 text-center py-4">No saved locations</li>
            ) : (
              savedLocations.map((item, idx) => (
                <li
                  key={idx}
                  className="bg-gray-50 p-3 rounded-lg flex justify-between items-start hover:bg-gray-100 transition-colors"
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => findRouteUsingCoords(item.coords)}
                  >
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(item.savedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => findRouteUsingCoords(item.coords)}
                      className="p-1.5 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200 transition-colors"
                      title="Navigate"
                    >
                      <Navigation className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteLocation(idx)}
                      className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
          <p className="text-xs text-gray-500 mt-2">
            Tip: Click a saved location to create a route to it.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
