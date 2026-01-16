import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Send, MapPin, Building2, Pill as PillIcon, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import axios from 'axios'; 

const AIHealthAssistant = () => {
    const navigate = useNavigate();
    const [prompt, setPrompt] = useState(""); 
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
        setPrompt(""); 
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const apiBaseURL = isLocalhost ? 'http://localhost:5000/api' : `http://${window.location.hostname}:5000/api`;
            
            const response = await axios.post(`${apiBaseURL}/ai/ask`, 
                { prompt: userMessage.content },
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
            const errorMessage = error.response?.data?.message || "I'm having trouble connecting. Please check your internet.";
            setMessages(prev => [...prev, { 
                role: "assistant", 
                content: errorMessage
            }]);
        } finally {
            setLoading(false);
        }
    };

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
                        headers: { 'Content-Type': 'application/json', 'auth-token': token },
                        body: JSON.stringify({ latitude, longitude, type })
                    });

                    const data = await response.json();
                    if (response.ok && data.success && data.places.length > 0) {
                        initializeMap(latitude, longitude, data.places, type);
                    } else {
                        alert(data.message || 'No facilities found nearby.');
                        initializeMap(latitude, longitude, [], type);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('An error occurred while fetching nearby places.');
                } finally {
                    setMapLoading(false);
                }
            },
            (error) => {
                alert('Please enable location services.');
                setMapLoading(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const initializeMap = (lat, lng, places, type) => {
        if (!window.google || !mapRef.current) return;

        try {
            if (!mapInstance.current) {
                mapInstance.current = new window.google.maps.Map(mapRef.current, {
                    center: { lat, lng },
                    zoom: 13,
                    styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "on" }] }]
                });
            } else {
                mapInstance.current.setCenter({ lat, lng });
            }

            // User location marker
            new window.google.maps.Marker({
                position: { lat, lng },
                map: mapInstance.current,
                title: "You are here",
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

            // Places markers
            places.forEach((place, index) => {
                const marker = new window.google.maps.Marker({
                    position: { lat: place.lat, lng: place.lng },
                    map: mapInstance.current,
                    title: place.name,
                    animation: window.google.maps.Animation.DROP,
                });

                const infoWindow = new window.google.maps.InfoWindow({
                    content: `<div style="padding:8px"><b>${place.name}</b><br/>${place.address}</div>`
                });

                marker.addListener('click', () => infoWindow.open(mapInstance.current, marker));
            });

            if (places.length > 0) {
                const bounds = new window.google.maps.LatLngBounds();
                bounds.extend({ lat, lng });
                places.forEach(place => bounds.extend({ lat: place.lat, lng: place.lng }));
                mapInstance.current.fitBounds(bounds);
            }
        } catch (error) {
            console.error('Map error:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6 md:p-10">
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-8">
                <div className="bg-white/80 backdrop-blur-sm p-6 shadow-2xl rounded-3xl border-t-4 border-purple-600">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate('/patient/dashboard')} className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl hover:bg-purple-200 transition">
                            <ArrowLeft className="h-6 w-6 text-purple-600" />
                        </button>
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-100 rounded-2xl">
                            <Brain className="h-7 w-7 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900">AI Health Assistant</h1>
                            <p className="text-gray-500 mt-1">Powered by HealthBridge Intelligence</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chat Section */}
                <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px]">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white flex justify-between items-center">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Sparkles className="h-5 w-5" /> Chat with AI
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 space-y-4">
                                <Brain className="w-16 h-16 opacity-20" />
                                <p>Ask me anything about symptoms, medicines, or healthy living!</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                                        msg.role === 'user' 
                                            ? 'bg-purple-600 text-white rounded-br-none' 
                                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                    }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))
                        )}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm border border-purple-100">
                                    <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 bg-white border-t border-gray-100">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAIQuery()}
                                placeholder="E.g., What are the symptoms of flu?"
                                className="flex-1 px-5 py-3 border-2 border-gray-100 rounded-xl focus:border-purple-500 focus:outline-none transition"
                                disabled={loading}
                            />
                            <button
                                onClick={handleAIQuery}
                                disabled={loading || !prompt.trim()}
                                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2 font-bold shadow-lg shadow-purple-200"
                            >
                                <Send className="w-4 h-4" /> Send
                            </button>
                        </div>
                        <p className="text-xs text-center text-gray-400 mt-2">
                            AI can make mistakes. Always consult a doctor for serious concerns.
                        </p>
                    </div>
                </div>

                {/* Map Buttons Section */}
                <div className="space-y-6">
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <MapPin className="text-purple-600" /> Find Nearby
                        </h2>
                        <div className="space-y-3">
                            <button onClick={() => findNearbyPlaces('hospital')} disabled={mapLoading} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl transition shadow-lg shadow-red-200 font-bold">
                                {mapLoading ? <Loader2 className="animate-spin" /> : <Building2 />} Find Hospitals
                            </button>
                            <button onClick={() => findNearbyPlaces('pharmacy')} disabled={mapLoading} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl transition shadow-lg shadow-green-200 font-bold">
                                {mapLoading ? <Loader2 className="animate-spin" /> : <PillIcon />} Find Pharmacies
                            </button>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden h-64 relative">
                        <div ref={mapRef} className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                            {!mapInstance.current && <p>Map will appear here</p>}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AIHealthAssistant;