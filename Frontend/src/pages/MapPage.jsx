import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, Save, Trash2, Search } from 'lucide-react';

const API_KEY = "ca1da5c3-bd8e-4621-a0e3-86bcae970b08"; // GraphHopper API key

const MapPage = () => {
    const navigate = useNavigate();
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const userMarkerRef = useRef(null);
    const destMarkerRef = useRef(null);
    const routeLayerRef = useRef(null);
    
    const [userCoords, setUserCoords] = useState(null);
    const [lastSearchedCoords, setLastSearchedCoords] = useState(null);
    const [destination, setDestination] = useState('');
    const [saveName, setSaveName] = useState('');
    const [routeInfo, setRouteInfo] = useState('');
    const [savedLocations, setSavedLocations] = useState([]);
    const [showSaveSearched, setShowSaveSearched] = useState(false);
    const [loading, setLoading] = useState(false);

    const STORAGE_KEY = "my_saved_locations_v1";

    // Load saved locations from localStorage
    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        setSavedLocations(saved);
    }, []);

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        // Wait for Leaflet to be available (with retry)
        const initMap = () => {
            if (!window.L) {
                console.warn('Leaflet not loaded yet, retrying...');
                setTimeout(initMap, 100);
                return;
            }

            // Initialize Leaflet map
            mapInstance.current = window.L.map(mapRef.current).setView([20.5937, 78.9629], 5);

            window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "&copy; OpenStreetMap"
            }).addTo(mapInstance.current);
        };

        initMap();

        // Watch user's location
        if ("geolocation" in navigator) {
            navigator.geolocation.watchPosition(
                (pos) => {
                    const coords = [pos.coords.latitude, pos.coords.longitude];
                    setUserCoords(coords);

                    if (userMarkerRef.current) {
                        mapInstance.current.removeLayer(userMarkerRef.current);
                    }

                    userMarkerRef.current = window.L.marker(coords).addTo(mapInstance.current);

                    if (mapInstance.current.getZoom() < 10) {
                        mapInstance.current.setView(coords, 14);
                    }
                },
                (err) => {
                    setRouteInfo("Location unavailable: " + err.message);
                },
                { enableHighAccuracy: true }
            );
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
            }
        };
    }, []);

    // Geocode function
    const geocode = async (query) => {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Geocoding failed");
        return res.json();
    };

    // Find route using coordinates
    const findRouteUsingCoords = async (dest) => {
        if (!userCoords) {
            alert("Waiting for your location...");
            return;
        }

        setLoading(true);
        setRouteInfo("Calculating route...");

        if (destMarkerRef.current) {
            mapInstance.current.removeLayer(destMarkerRef.current);
        }
        destMarkerRef.current = window.L.marker(dest)
            .addTo(mapInstance.current)
            .bindPopup("Destination")
            .openPopup();

        const url = `https://graphhopper.com/api/1/route?point=${userCoords[0]},${userCoords[1]}&point=${dest[0]},${dest[1]}&profile=car&points_encoded=false&calc_points=true&locale=en&key=${API_KEY}`;

        try {
            const res = await fetch(url);
            const data = await res.json();

            if (data.paths && data.paths.length > 0) {
                const route = data.paths[0];
                const coords = route.points.coordinates.map((c) => [c[1], c[0]]);

                if (routeLayerRef.current) {
                    mapInstance.current.removeLayer(routeLayerRef.current);
                }
                routeLayerRef.current = window.L.polyline(coords, { color: "blue", weight: 5 }).addTo(mapInstance.current);
                mapInstance.current.fitBounds(routeLayerRef.current.getBounds());

                setRouteInfo(
                    `Distance: ${(route.distance / 1000).toFixed(2)} km | Duration: ${(route.time / 60000).toFixed(1)} min`
                );
            } else {
                setRouteInfo("Error: Could not calculate route");
            }
        } catch (e) {
            setRouteInfo("Error: " + e.message);
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
        if (!userCoords) {
            alert("Waiting for your location...");
            return;
        }

        setLoading(true);
        setRouteInfo("Searching...");

        try {
            const data = await geocode(q);
            if (!data.length) throw new Error("Not found");

            const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            setLastSearchedCoords(coords);
            setShowSaveSearched(true);

            await findRouteUsingCoords(coords);
        } catch (e) {
            setRouteInfo("Error: " + e.message);
            setLoading(false);
        }
    };

    // Save searched destination
    const handleSaveSearched = () => {
        if (!lastSearchedCoords) {
            alert("No destination searched!");
            return;
        }

        const name = prompt("Enter a name for this destination:", destination);
        if (!name) return;

        const arr = [...savedLocations];
        arr.unshift({
            name,
            coords: lastSearchedCoords,
            savedAt: new Date().toISOString(),
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
        setSavedLocations(arr);
        setShowSaveSearched(false);
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative">
            {/* Map Container */}
            <div ref={mapRef} className="w-full h-screen" />

            {/* Controls Panel */}
            <aside className="absolute top-4 left-4 w-80 max-w-[calc(100%-32px)] bg-gray-900/90 backdrop-blur-sm text-white p-4 rounded-xl z-[1000] shadow-2xl">
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
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                                id="destination"
                                type="text"
                                placeholder="Search destination (e.g. Taj Mahal)"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFindRoute()}
                                className="w-full pl-10 pr-3 py-2 rounded-lg border-none bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            onClick={handleFindRoute}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? '...' : 'Find'}
                        </button>
                    </div>
                    {showSaveSearched && (
                        <button
                            onClick={handleSaveSearched}
                            className="mt-2 w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            Save This Destination
                        </button>
                    )}
                </div>

                {/* Route Info */}
                {routeInfo && (
                    <div className="mb-4 p-3 bg-blue-500/20 rounded-lg text-sm text-blue-200">
                        {routeInfo}
                    </div>
                )}

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
        </div>
    );
};

export default MapPage;

