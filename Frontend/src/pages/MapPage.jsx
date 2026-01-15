import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, Save, Trash2, Search, Hospital } from 'lucide-react';
import axios from 'axios';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer, Autocomplete, InfoWindow } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = "AIzaSyD7Vw4BlccSY7Y677v599yhYC7heGWi65s";
const LIBRARIES = ["places"];  // Define libraries as a constant outside component

const MapPage = () => {
    const navigate = useNavigate();
    const [userCoords, setUserCoords] = useState({ lat: 28.6139, lng: 77.209 });
    const [destination, setDestination] = useState('');
    const [saveName, setSaveName] = useState('');
    const [routeInfo, setRouteInfo] = useState('');
    const [savedLocations, setSavedLocations] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [directions, setDirections] = useState(null);
    const [showHospitals, setShowHospitals] = useState(true);
    const [loading, setLoading] = useState(false);
    const [mapRef, setMapRef] = useState(null);
    const [selectedHospital, setSelectedHospital] = useState(null);
    const autocompleteRef = useRef(null);

    const STORAGE_KEY = "my_saved_locations_v1";

    // Fetch hospitals from backend
    const fetchHospitals = async () => {
        try {
            const response = await axios.get('/api/hospitals/all');
            setHospitals(response.data);
        } catch (error) {
            console.error('Error fetching hospitals:', error);
        }
    };

    // Load saved locations from localStorage
    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        setSavedLocations(saved);
    }, []);

    // Load hospitals on component mount
    useEffect(() => {
        fetchHospitals();
    }, []);

    // Get user's location
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserCoords({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    });
                },
                (err) => {
                    console.error("Location unavailable: " + err.message);
                }
            );
        }
    }, []);

    // Find route using Google Directions API
    const findRouteUsingCoords = async (destCoords) => {
        if (!window.google) return;

        setLoading(true);
        setRouteInfo("Calculating route...");

        const directionsService = new window.google.maps.DirectionsService();

        try {
            const result = await directionsService.route({
                origin: new window.google.maps.LatLng(userCoords.lat, userCoords.lng),
                destination: new window.google.maps.LatLng(destCoords.lat, destCoords.lng),
                travelMode: window.google.maps.TravelMode.DRIVING,
            });

            setDirections(result);

            if (result.routes.length > 0) {
                const route = result.routes[0];
                const leg = route.legs[0];
                setRouteInfo(
                    `Distance: ${leg.distance.text} | Duration: ${leg.duration.text}`
                );
            }
        } catch (error) {
            console.error("Error calculating route:", error);
            setRouteInfo("Error: Could not calculate route");
        } finally {
            setLoading(false);
        }
    };

    // Find route by search
    const handleFindRoute = async () => {
        const q = destination.trim();
        if (!q) {
            alert("Enter destination!");
            return;
        }

        setLoading(true);
        setRouteInfo("Searching...");

        try {
            if (autocompleteRef.current) {
                const place = autocompleteRef.current.getPlace();
                if (place && place.geometry) {
                    const destCoords = {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng()
                    };
                    await findRouteUsingCoords(destCoords);
                } else {
                    setRouteInfo("Error: Location not found");
                    setLoading(false);
                }
            }
        } catch (e) {
            setRouteInfo("Error: " + e.message);
            setLoading(false);
        }
    };

    // Save current location
    const handleSaveLocation = () => {
        if (!userCoords) {
            alert("Waiting for your location...");
            return;
        }

        const name = saveName.trim() || "Location " + new Date().toLocaleString();

        const arr = [...savedLocations];
        arr.unshift({
            name,
            coords: userCoords,
            savedAt: new Date().toISOString(),
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
        setSavedLocations(arr);
        setSaveName("");
    };

    // Clear all saved locations
    const handleClearAll = () => {
        if (!confirm("Delete all saved locations?")) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        setSavedLocations([]);
    };

    // Click on saved location
    const handleSavedLocationClick = (coords) => {
        findRouteUsingCoords(coords);
    };

    // Handle hospital marker click
    const handleHospitalClick = async (hospital) => {
        setSelectedHospital(hospital);
        const destCoords = {
            lat: hospital.location.coordinates[1],
            lng: hospital.location.coordinates[0]
        };
        await findRouteUsingCoords(destCoords);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative">
            {/* Google Map Container */}
            <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={LIBRARIES}>
                <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100vh' }}
                    center={userCoords}
                    zoom={14}
                    onLoad={(map) => setMapRef(map)}
                >
                    {/* User's Current Location Marker */}
                    <Marker
                        position={userCoords}
                        title="Your Location"
                        icon={{
                            path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                            scale: 10,
                            fillColor: '#4285F4',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 3,
                        }}
                    />

                    {/* Hospital Markers */}
                    {showHospitals && hospitals.map((hospital, idx) => (
                        <Marker
                            key={idx}
                            position={{
                                lat: hospital.location.coordinates[1],
                                lng: hospital.location.coordinates[0],
                            }}
                            title={hospital.name}
                            onClick={() => handleHospitalClick(hospital)}
                            icon={{
                                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><circle cx="16" cy="16" r="14" fill="%23ef4444" stroke="%23ffffff" stroke-width="2"/><text x="16" y="20" font-size="16" text-anchor="middle" fill="white" dominant-baseline="middle">🏥</text></svg>'
                                ),
                                scaledSize: new window.google.maps.Size(40, 40),
                            }}
                        />
                    ))}

                    {/* Saved Locations Markers */}
                    {savedLocations.map((location, idx) => (
                        <Marker
                            key={`saved-${idx}`}
                            position={{
                                lat: location.coords.lat,
                                lng: location.coords.lng,
                            }}
                            title={location.name}
                            icon={{
                                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><circle cx="16" cy="16" r="14" fill="%2322c55e" stroke="%23ffffff" stroke-width="2"/><text x="16" y="20" font-size="16" text-anchor="middle" fill="white" dominant-baseline="middle">📍</text></svg>'
                                ),
                                scaledSize: new window.google.maps.Size(40, 40),
                            }}
                        />
                    ))}

                    {/* Hospital Info Window */}
                    {selectedHospital && (
                        <InfoWindow
                            position={{
                                lat: selectedHospital.location.coordinates[1],
                                lng: selectedHospital.location.coordinates[0],
                            }}
                            onCloseClick={() => setSelectedHospital(null)}
                        >
                            <div className="bg-white p-4 rounded-lg shadow-lg max-w-xs">
                                <h3 className="text-lg font-bold text-gray-800 mb-2">{selectedHospital.name}</h3>
                                {selectedHospital.address && (
                                    <p className="text-sm text-gray-600 mb-1">
                                        <span className="font-semibold">Address:</span> {selectedHospital.address}
                                    </p>
                                )}
                                {selectedHospital.phone && (
                                    <p className="text-sm text-gray-600 mb-1">
                                        <span className="font-semibold">Phone:</span> {selectedHospital.phone}
                                    </p>
                                )}
                                {selectedHospital.specialties && selectedHospital.specialties.length > 0 && (
                                    <p className="text-sm text-gray-600 mb-2">
                                        <span className="font-semibold">Specialties:</span> {selectedHospital.specialties.join(', ')}
                                    </p>
                                )}
                                <p className="text-sm text-blue-600 font-semibold">
                                    Check route info in the sidebar →
                                </p>
                            </div>
                        </InfoWindow>
                    )}

                    {/* Directions */}
                    {directions && <DirectionsRenderer directions={directions} />}
                </GoogleMap>

                {/* Controls Panel */}
                <aside className="absolute top-4 left-4 w-80 max-w-[calc(100%-32px)] bg-gray-900/90 backdrop-blur-sm text-white p-4 rounded-xl z-[1000] shadow-2xl max-h-[calc(100vh-32px)] overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => navigate('/patient/dashboard')}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h2 className="text-xl font-bold flex items-center">
                            <Navigation className="h-5 w-5 mr-2" />
                            Route Finder
                        </h2>
                    </div>

                    {/* Destination Search */}
                    <div className="mb-4">
                        <label className="block text-xs text-gray-400 mb-2">Destination</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Autocomplete
                                    onLoad={(autocomplete) => {
                                        autocompleteRef.current = autocomplete;
                                    }}
                                    onPlaceChanged={() => {
                                        if (autocompleteRef.current) {
                                            const place = autocompleteRef.current.getPlace();
                                            if (place && place.formatted_address) {
                                                setDestination(place.formatted_address);
                                            }
                                        }
                                    }}
                                >
                                    <input
                                        type="text"
                                        placeholder="Search destination"
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleFindRoute()}
                                        className="w-full px-3 py-2 rounded-lg border-none bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </Autocomplete>
                            </div>
                            <button
                                onClick={handleFindRoute}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? '...' : 'Find'}
                            </button>
                        </div>
                    </div>

                {/* Route Info */}
                {routeInfo && (
                    <div className="mb-4 p-3 bg-blue-500/20 rounded-lg text-sm text-blue-200">
                        {routeInfo}
                    </div>
                )}

                <hr className="border-gray-700 my-4" />

                {/* Hospital Finder Toggle */}
                <div className="mb-4">
                    <button
                        onClick={() => setShowHospitals(!showHospitals)}
                        className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                            showHospitals
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                    >
                        <Hospital className="h-4 w-4" />
                        {showHospitals ? 'Hide' : 'Show'} Registered Hospitals ({hospitals.length})
                    </button>
                    {hospitals.length === 0 && (
                        <p className="text-xs text-gray-400 mt-2 text-center">No hospitals registered yet</p>
                    )}
                </div>

                <hr className="border-gray-700 my-4" />

                {/* Save Current Location */}
                <div className="mb-4">
                    <label className="block text-xs text-gray-400 mb-2">Save current location</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Name for this location"
                            value={saveName}
                            onChange={(e) => setSaveName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveLocation()}
                            className="flex-1 px-3 py-2 rounded-lg border-none bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleSaveLocation}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            Save
                        </button>
                    </div>
                </div>

                {/* Saved Locations */}
                <div className="mb-2">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">Saved Locations</h3>
                        {savedLocations.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                className="text-xs text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1"
                            >
                                <Trash2 className="h-3 w-3" />
                                Clear All
                            </button>
                        )}
                    </div>
                    <ul className="max-h-60 overflow-y-auto space-y-2">
                        {savedLocations.length === 0 ? (
                            <li className="text-gray-400 text-sm py-2">No saved locations</li>
                        ) : (
                            savedLocations.map((item, idx) => (
                                <li
                                    key={idx}
                                    className="flex items-center justify-between p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                                    onClick={() => handleSavedLocationClick(item.coords)}
                                >
                                    <div className="flex-1">
                                        <div className="font-semibold text-sm">{item.name}</div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {new Date(item.savedAt).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSavedLocationClick(item.coords);
                                            }}
                                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors"
                                        >
                                            Route
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const arr = [...savedLocations];
                                                arr.splice(idx, 1);
                                                localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
                                                setSavedLocations(arr);
                                            }}
                                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>

                <p className="text-xs text-gray-400 mt-4">
                    Tip: Click a saved location to create a route to it.
                </p>
                </aside>
            </LoadScript>
        </div>
    );
};

export default MapPage;

