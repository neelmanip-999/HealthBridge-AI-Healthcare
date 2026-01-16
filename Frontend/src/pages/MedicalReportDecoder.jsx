import React, { useState } from 'react';
import axios from 'axios';
import { FileText, Sparkles, AlertCircle, ArrowLeft, CheckCircle2, Loader2, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MedicalReportDecoder = () => {
    const navigate = useNavigate();
    const [reportText, setReportText] = useState("");
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState(null);

    const handleAnalyze = async () => {
        if (!reportText.trim()) return;
        setLoading(true);
        setAnalysis(null);

        try {
            const token = localStorage.getItem('token');
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const apiBaseURL = isLocalhost ? 'http://localhost:5000/api' : `http://${window.location.hostname}:5000/api`;

            // Using the "Generative AI" endpoint (LLM)
            const res = await axios.post(`${apiBaseURL}/ai/query`, {
                prompt: reportText,
                context: "report_analysis" 
            }, { headers: { 'auth-token': token } });

            if (res.data.success) {
                setAnalysis(res.data.response);
            } else {
                setAnalysis("Could not analyze report. Please try again.");
            }
        } catch (err) {
            console.error("Analysis Error:", err);
            setAnalysis("Failed to connect to AI service.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 md:p-10">
            <div className="max-w-5xl mx-auto">
                
                <button onClick={() => navigate('/patient/dashboard')} className="flex items-center text-gray-500 hover:text-indigo-600 mb-8 transition group">
                    <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform"/> Back to Dashboard
                </button>

                {/* Header */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border-l-8 border-purple-600 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                        <Sparkles className="w-64 h-64 text-purple-600" />
                    </div>
                    <div className="relative z-10">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 flex items-center gap-3">
                            <Sparkles className="w-10 h-10 text-purple-600"/> AI Report Decoder
                        </h1>
                        <p className="text-gray-600 max-w-2xl text-lg">
                            This tool uses Generative AI to explain your report in simple English. (Distinct from your ML Prediction Model).
                        </p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    
                    {/* INPUT */}
                    <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 flex flex-col h-[600px]">
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Paste Report Text</label>
                            <p className="text-xs text-gray-400">Copy text from your PDF report and paste it here.</p>
                        </div>
                        <textarea 
                            value={reportText}
                            onChange={(e) => setReportText(e.target.value)}
                            placeholder={`Example:\nCBC Results:\nWBC: 12.5 (High)\nRBC: 4.8\nPlatelets: 150`}
                            className="flex-1 w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none resize-none font-mono text-sm text-gray-700 placeholder-gray-400 transition-all"
                        />
                        <button 
                            onClick={handleAnalyze}
                            disabled={loading || !reportText}
                            className="w-full mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <><Loader2 className="w-6 h-6 animate-spin"/> Decoding...</> : <><Sparkles className="w-6 h-6"/> Explain This</>}
                        </button>
                    </div>

                    {/* OUTPUT */}
                    <div className={`bg-white p-8 rounded-3xl shadow-lg border border-gray-100 h-[600px] overflow-hidden flex flex-col relative ${!analysis ? 'justify-center items-center' : ''}`}>
                        {!analysis && !loading && (
                            <div className="text-center text-gray-400 opacity-50">
                                <Activity className="w-24 h-24 mx-auto mb-4 stroke-1"/>
                                <p className="text-lg font-medium">Explanation will appear here</p>
                            </div>
                        )}

                        {loading && (
                            <div className="text-center">
                                <div className="w-20 h-20 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin mx-auto mb-6"></div>
                                <h3 className="text-xl font-bold text-purple-900 animate-pulse">Reading Report...</h3>
                            </div>
                        )}

                        {analysis && (
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                                    <div className="bg-green-100 p-3 rounded-2xl"><CheckCircle2 className="w-8 h-8 text-green-600" /></div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">AI Explanation</h3>
                                        <p className="text-sm text-green-600 font-medium">Simplified for you</p>
                                    </div>
                                </div>
                                <div className="prose prose-purple max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {analysis}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MedicalReportDecoder;