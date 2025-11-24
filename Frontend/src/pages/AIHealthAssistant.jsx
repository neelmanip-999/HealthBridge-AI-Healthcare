import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Send, MapPin, Hospital, Pill as PillIcon, ArrowLeft, Loader2 } from "lucide-react";
import axios from 'axios'; // Using Axios for cleaner API calls

const AIHealthAssistant = () => {
    const navigate = useNavigate();
    const [prompt, setPrompt] = useState(""); // Changed state name for clarity
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mapLoading, setMapLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const mapRef = useRef(null);
    const mapInstance = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleAIQuery = async () => {
        if (!prompt.trim()) return;

        const userMessage = { role: "user", content: prompt };
        setMessages(prev => [...prev, userMessage]);
        setPrompt(""); // Clear input after sending
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            
            // Corrected API endpoint and request body
            const response = await axios.post('/api/ai/ask', 
                { prompt: userMessage.content }, // Sending 'prompt' to match backend
                { headers: { 'auth-token': token } }
            );
            
            if (response.data && response.data.success) {
                setMessages(prev => [...prev, { role: "assistant", content: response.data.response }]);
            } else {
                setMessages(prev => [...prev, { 
                    role: "assistant", 
                    content: response.data.message || "I apologize, but I encountered an error. Please try again." 
                }]);
            }
        } catch (error) {
            console.error('API Error:', error);
            const errorMessage = error.response?.data?.message || "I'm having trouble connecting. Please check your connection and try again.";
            setMessages(prev => [...prev, { 
                role: "assistant", 
                content: errorMessage
            }]);
        } finally {
            setLoading(false);
        }
    };

    // --- Google Maps and other functions remain unchanged ---
    const findNearbyPlaces = async (type) => {
        setMapLoading(true);
        
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            setMapLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                try {
                    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
                    const token = localStorage.getItem('token');
                    
                    const response = await fetch(`${apiUrl}/api/maps/nearby`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'auth-token': token
                        },
                        body: JSON.stringify({
                            latitude,
                            longitude,
                            type
                        })
                    });

                    const data = await response.json();
                    
                    if (response.ok && data.success) {
                        if (data.places && data.places.length > 0) {
                            initializeMap(latitude, longitude, data.places, type);
                        } else {
                            alert(data.message || 'No facilities found nearby. Try increasing the search radius.');
                            initializeMap(latitude, longitude, [], type);
                        }
                    } else {
                        alert(data.message || 'Could not fetch nearby places. Please try again.');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('An error occurred while fetching nearby places. Please try again.');
                } finally {
                    setMapLoading(false);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Please enable location services to find nearby facilities.');
                setMapLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    const initializeMap = (lat, lng, places, type) => {
        if (!window.google) {
            alert('Google Maps is not loaded. Please check your internet connection and refresh the page.');
            return;
        }

        if (!mapRef.current) {
            console.error('Map container not found');
            return;
        }

        try {
            if (!mapInstance.current) {
                mapInstance.current = new window.google.maps.Map(mapRef.current, {
                    center: { lat, lng },
                    zoom: 13,
                    styles: [
                        {
                            featureType: "poi",
                            elementType: "labels",
                            stylers: [{ visibility: "on" }]
                        }
                    ]
                });
            } else {
                mapInstance.current.setCenter({ lat, lng });
            }

            new window.google.maps.Marker({
                position: { lat, lng },
                map: mapInstance.current,
                title: "Your Location",
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: "#4F46E5",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 3
                },
                zIndex: 1000
            });

            places.forEach((place, index) => {
                const marker = new window.google.maps.Marker({
                    position: { lat: place.lat, lng: place.lng },
                    map: mapInstance.current,
                    title: place.name,
                    icon: {
                        url: type === 'hospital' 
                            ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                            : 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                    },
                    animation: window.google.maps.Animation.DROP,
                    zIndex: index
                });

                const infoWindow = new window.google.maps.InfoWindow({
                    content: `
                        <div style="padding: 12px; max-width: 250px;">
                            <h3 style="font-weight: bold; margin: 0 0 8px 0; font-size: 16px; color: #1f2937;">${place.name}</h3>
                            <p style="margin: 0 0 6px 0; color: #6b7280; font-size: 14px;">${place.address}</p>
                            ${place.rating ? `<p style="margin: 0; color: #059669; font-weight: 600;">⭐ ${place.rating} (${place.userRatingsTotal || 0} reviews)</p>` : ''}
                            ${place.isOpen !== null ? `<p style="margin: 4px 0 0 0; color: ${place.isOpen ? '#059669' : '#dc2626'}; font-weight: 600; font-size: 13px;">${place.isOpen ? '🟢 Open Now' : '🔴 Closed'}</p>` : ''}
                        </div>
                    `
                });

                marker.addListener('click', () => {
                    infoWindow.open(mapInstance.current, marker);
                });
            });

            if (places.length > 0) {
                const bounds = new window.google.maps.LatLngBounds();
                bounds.extend({ lat, lng });
                places.forEach(place => {
                    bounds.extend({ lat: place.lat, lng: place.lng });
                });
                mapInstance.current.fitBounds(bounds);
            }

        } catch (error) {
            console.error('Map initialization error:', error);
            alert('Error initializing map. Please refresh the page.');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAIQuery();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6 md:p-10">
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-8">
                <div className="bg-white/80 backdrop-blur-sm p-6 shadow-2xl rounded-3xl border-t-4 border-purple-600">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button 
                                onClick={() => navigate('/patient/dashboard')}
                                className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl hover:bg-purple-200 transition-colors duration-300"
                            >
                                <ArrowLeft className="h-6 w-6 text-purple-600" />
                            </button>
                            <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-100 rounded-2xl">
                                <Brain className="h-7 w-7 text-purple-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-900">AI Health Assistant</h1>
                                <p className="text-gray-500 mt-1">Get instant health answers & find nearby facilities</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* AI Chat Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
                                <h2 className="text-2xl font-bold text-white flex items-center">
                                    <Brain className="h-6 w-6 mr-3" />
                                    Ask from AI
                                </h2>
                                <p className="text-purple-100 mt-2">Ask any health-related questions</p>
                            </div>

                            {/* Messages */}
                            <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-purple-50/30 to-transparent">
                                {messages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-4">
                                                <Brain className="h-10 w-10 text-purple-600" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-gray-700 mb-2">Start a Conversation</h3>
                                            <p className="text-gray-500 max-w-md">Ask me anything about health, symptoms, medications, or wellness tips!</p>
                                        </div>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                                                msg.role === 'user' 
                                                    ? 'bg-purple-600 text-white rounded-br-none' 
                                                    : 'bg-white text-gray-800 shadow-lg rounded-bl-none border border-purple-100'
                                            }`}>
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {loading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-lg border border-purple-100">
                                            <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-6 bg-white border-t border-purple-100">
                                <div className="flex space-x-3">
                                    <input
                                        type="text"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Type your health question here..."
                                        className="flex-1 px-6 py-3 border-2 border-purple-200 rounded-2xl focus:outline-none focus:border-purple-500 transition-colors duration-300"
                                        disabled={loading}
                                    />
                                    <button
                                        onClick={handleAIQuery}
                                        disabled={loading || !prompt.trim()}
                                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl"
                                    >
                                        {loading ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <Send className="h-5 w-5" />
                                        )}
                                        <span className="font-semibold">Send</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Map Section */}
                    <div className="space-y-6">
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                <MapPin className="h-6 w-6 mr-3 text-purple-600" />
                                Find Nearby
                            </h2>
                            
                            <div className="space-y-4">
                                <button
                                    onClick={() => findNearbyPlaces('hospital')}
                                    disabled={mapLoading}
                                    className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {mapLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Hospital className="h-6 w-6" />}
                                    <span className="font-semibold">Find Hospitals</span>
                                </button>

                                <button
                                    onClick={() => findNearbyPlaces('pharmacy')}
                                    disabled={mapLoading}
                                    className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {mapLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <PillIcon className="h-6 w-6" />}
                                    <span className="font-semibold">Find Pharmacies</span>
                                </button>
                            </div>

                            {mapLoading && (
                                <div className="mt-4 flex items-center justify-center space-x-2 text-purple-600">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span className="font-medium">Loading map...</span>
                                </div>
                            )}
                        </div>

                        {/* Map Container */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
                            <div 
                                ref={mapRef} 
                                className="w-full h-96 bg-gray-100"
                                style={{ minHeight: '400px' }}
                            >
                                {!mapInstance.current && (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center text-gray-500 p-6">
                                            <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                            <p className="font-medium">Click a button above to view map</p>
                                            <p className="text-sm mt-2">Location access required</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AIHealthAssistant;
