import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Brain, AlertCircle, CheckCircle, Loader2, ArrowLeft, Download, 
  RefreshCw, Activity, Heart, Thermometer, Droplet, Gauge, User, 
  TrendingUp, AlertTriangle, Sparkles
} from 'lucide-react';
import { analyzeReport, checkMLServiceHealth } from '../services/api';

const ReportAnalysis = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState({});
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [mlServiceStatus, setMlServiceStatus] = useState(null);

  // Grouped medical report fields for better organization
  const fieldGroups = [
    {
      title: 'Patient Information',
      icon: User,
      fields: [
        { key: 'Age', label: 'Age', type: 'number', icon: User },
        { key: 'Gender', label: 'Gender', type: 'select', options: ['Male', 'Female'], icon: User },
      ]
    },
    {
      title: 'Vital Signs',
      icon: Activity,
      fields: [
        { key: 'BloodPressure', label: 'Blood Pressure (mmHg)', type: 'number', placeholder: 'e.g., 120', icon: Gauge },
        { key: 'HeartRate', label: 'Heart Rate (bpm)', type: 'number', placeholder: 'e.g., 72', icon: Heart },
        { key: 'BMI', label: 'BMI (Body Mass Index)', type: 'number', placeholder: 'e.g., 25', icon: TrendingUp },
      ]
    },
    {
      title: 'Lab Results',
      icon: Droplet,
      fields: [
        { key: 'Cholesterol', label: 'Cholesterol (mg/dL)', type: 'number', placeholder: 'e.g., 200', icon: Droplet },
        { key: 'Glucose', label: 'Blood Glucose (mg/dL)', type: 'number', placeholder: 'e.g., 95', icon: Droplet },
      ]
    },
    {
      title: 'Symptoms',
      icon: AlertTriangle,
      fields: [
        { key: 'Fever', label: 'Fever', type: 'select', options: ['0', '1'], icon: Thermometer },
        { key: 'Cough', label: 'Cough', type: 'select', options: ['0', '1'], icon: AlertTriangle },
        { key: 'Fatigue', label: 'Fatigue', type: 'select', options: ['0', '1'], icon: Activity },
        { key: 'Headache', label: 'Headache', type: 'select', options: ['0', '1'], icon: AlertTriangle },
        { key: 'Nausea', label: 'Nausea', type: 'select', options: ['0', '1'], icon: AlertTriangle },
        { key: 'ShortnessBreath', label: 'Shortness of Breath', type: 'select', options: ['0', '1'], icon: Activity },
      ]
    }
  ];

  const getDiseaseColor = (disease) => {
    const colors = {
      'Healthy': 'text-green-600 bg-green-50 border-green-200',
      'Cardiovascular Disease': 'text-red-600 bg-red-50 border-red-200',
      'Diabetes': 'text-orange-600 bg-orange-50 border-orange-200',
      'Obesity': 'text-amber-600 bg-amber-50 border-amber-200',
      'Multiple Conditions': 'text-purple-600 bg-purple-50 border-purple-200',
      'Cardio-Diabetic Condition': 'text-pink-600 bg-pink-50 border-pink-200',
      'Viral Infection': 'text-blue-600 bg-blue-50 border-blue-200',
      'Respiratory Disease': 'text-cyan-600 bg-cyan-50 border-cyan-200',
    };
    return colors[disease] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const checkServiceStatus = () => {
    checkMLServiceHealth()
      .then(res => {
        setMlServiceStatus(res.data);
      })
      .catch(err => {
        console.error('ML Service health check error:', err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          setMlServiceStatus({ 
            success: false, 
            message: 'Please login to check ML service status' 
          });
        } else {
          setMlServiceStatus({ 
            success: false, 
            message: 'ML service unavailable. Please ensure the ML service is running on port 5001.' 
          });
        }
      });
  };

  React.useEffect(() => {
    checkServiceStatus();
  }, []);

  const handleFieldChange = (key, value) => {
    setReportData(prev => ({
      ...prev,
      [key]: value
    }));
  };


  const handleAnalyze = async () => {
    if (Object.keys(reportData).length === 0) {
      setError('Please enter patient report data');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await analyzeReport(reportData);
      setAnalysisResult(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Error analyzing report. Please ensure the ML service is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setReportData({});
    setAnalysisResult(null);
    setError(null);
  };

  const exportResults = () => {
    if (!analysisResult) return;
    
    const result = analysisResult.analysis;
    const analyzedDate = new Date(result.analyzedAt).toLocaleString();
    
    // Generate human-readable report
    let reportText = '';
    reportText += '═══════════════════════════════════════════════════════════════\n';
    reportText += '           PATIENT REPORT ANALYSIS - AI DIAGNOSIS\n';
    reportText += '═══════════════════════════════════════════════════════════════\n\n';
    
    reportText += `Analysis Date: ${analyzedDate}\n`;
    reportText += `Generated by: HealthBridge AI System\n\n`;
    
    reportText += '───────────────────────────────────────────────────────────────\n';
    reportText += '                    DIAGNOSIS SUMMARY\n';
    reportText += '───────────────────────────────────────────────────────────────\n\n';
    
    reportText += `Predicted Condition: ${result.prediction}\n`;
    reportText += `Confidence Level: ${(result.confidence * 100).toFixed(2)}%\n\n`;
    
    // Confidence interpretation
    const confidence = result.confidence * 100;
    let confidenceLevel = '';
    if (confidence >= 90) confidenceLevel = 'Very High';
    else if (confidence >= 75) confidenceLevel = 'High';
    else if (confidence >= 60) confidenceLevel = 'Moderate';
    else confidenceLevel = 'Low';
    
    reportText += `Confidence Rating: ${confidenceLevel}\n\n`;
    
    if (result.probabilities) {
      reportText += '───────────────────────────────────────────────────────────────\n';
      reportText += '              PROBABILITY DISTRIBUTION\n';
      reportText += '───────────────────────────────────────────────────────────────\n\n';
      
      reportText += 'The following shows the probability of each possible condition:\n\n';
      
      const sortedProbs = Object.entries(result.probabilities)
        .sort(([, a], [, b]) => b - a);
      
      sortedProbs.forEach(([condition, prob], index) => {
        const percentage = (prob * 100).toFixed(2);
        const barLength = Math.round(prob * 30); // 30 character bar
        const bar = '█'.repeat(barLength);
        const isTop = index === 0 ? ' ⭐' : '';
        
        reportText += `${(index + 1).toString().padStart(2, ' ')}. ${condition.padEnd(35)} ${percentage.padStart(6)}% ${bar}${isTop}\n`;
      });
      
      reportText += '\n';
    }
    
    reportText += '───────────────────────────────────────────────────────────────\n';
    reportText += '                    IMPORTANT NOTES\n';
    reportText += '───────────────────────────────────────────────────────────────\n\n';
    
    reportText += '⚠️  DISCLAIMER:\n';
    reportText += 'This AI-powered analysis is for informational purposes only.\n';
    reportText += 'It should NOT replace professional medical diagnosis or treatment.\n';
    reportText += 'Please consult with a qualified healthcare provider for accurate\n';
    reportText += 'diagnosis and appropriate medical care.\n\n';
    
    reportText += 'This report is generated by an automated system and may contain\n';
    reportText += 'errors. Always seek professional medical advice for health concerns.\n\n';
    
    reportText += '═══════════════════════════════════════════════════════════════\n';
    reportText += `Report ID: ${Date.now()}\n`;
    reportText += 'HealthBridge AI Healthcare Platform\n';
    reportText += '═══════════════════════════════════════════════════════════════\n';
    
    // Create and download text file
    const dataBlob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `Medical-Report-Analysis-${dateStr}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const fillSampleData = () => {
    setReportData({
      Age: 45,
      Gender: 'Male',
      BloodPressure: 120,
      Cholesterol: 200,
      Glucose: 95,
      HeartRate: 72,
      BMI: 25,
      Fever: '0',
      Cough: '0',
      Fatigue: '0',
      Headache: '1',
      Nausea: '0',
      ShortnessBreath: '0'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-indigo-100 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <ArrowLeft className="w-6 h-6 text-indigo-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    AI Report Analysis
                  </h1>
                  <p className="text-gray-600 mt-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Powered by Machine Learning
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced ML Service Status */}
          {mlServiceStatus && (
            <div className={`mt-6 p-4 rounded-xl flex items-center justify-between border-2 transition-all ${
              mlServiceStatus.success && mlServiceStatus.mlService?.model_loaded
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-200 shadow-sm'
                : 'bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-800 border-yellow-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-3">
                {mlServiceStatus.success && mlServiceStatus.mlService?.model_loaded ? (
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                ) : (
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  </div>
                )}
                <div>
                  <p className="font-semibold">
                    {mlServiceStatus.success && mlServiceStatus.mlService?.model_loaded
                      ? 'ML Model Ready'
                      : 'ML Service Unavailable'}
                  </p>
                  <p className="text-sm opacity-80">
                    {mlServiceStatus.success && mlServiceStatus.mlService?.model_loaded
                      ? 'AI analysis engine is operational'
                      : 'Please ensure the ML service is running'}
                  </p>
                </div>
              </div>
              <button
                onClick={checkServiceStatus}
                className="p-2 hover:bg-white/60 rounded-lg transition-all hover:rotate-180 duration-300"
                title="Refresh Status"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Enhanced Input Section */}
          <div className="xl:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-7 h-7 text-indigo-600" />
                Patient Report
              </h2>
              <button
                onClick={fillSampleData}
                className="px-4 py-2 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition font-medium"
              >
                Fill Sample Data
              </button>
            </div>

            <div className="space-y-6 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
              {fieldGroups.map((group, groupIdx) => (
                <div key={groupIdx} className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                    <group.icon className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-semibold text-gray-800">{group.title}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.fields.map(field => {
                      const FieldIcon = field.icon || FileText;
                      return (
                        <div key={field.key} className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <FieldIcon className="w-4 h-4 text-indigo-500" />
                            {field.label}
                          </label>
                          {field.type === 'select' ? (
                            <select
                              value={reportData[field.key] || ''}
                              onChange={(e) => handleFieldChange(field.key, e.target.value)}
                              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white hover:border-gray-300"
                            >
                              <option value="">Select...</option>
                              {field.options.map(opt => (
                                <option key={opt} value={opt}>
                                  {opt === '0' ? 'No' : opt === '1' ? 'Yes' : opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type}
                              value={reportData[field.key] || ''}
                              onChange={(e) => handleFieldChange(field.key, e.target.value)}
                              placeholder={field.placeholder}
                              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white hover:border-gray-300"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleAnalyze}
                disabled={loading || Object.keys(reportData).length === 0}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3.5 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5" />
                    Analyze Report
                  </>
                )}
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3.5 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition hover:border-gray-400"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Enhanced Results Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
              <Sparkles className="w-7 h-7 text-purple-600" />
              Analysis Results
            </h2>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-800 p-4 rounded-xl mb-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {analysisResult ? (
              <div className="space-y-5">
                {/* Main Prediction Card */}
                <div className={`p-6 rounded-xl border-2 ${getDiseaseColor(analysisResult.analysis.prediction)}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium opacity-80 mb-1">Predicted Condition</p>
                      <p className="text-2xl font-bold">
                        {analysisResult.analysis.prediction}
                      </p>
                    </div>
                    <div className="p-3 bg-white/50 rounded-lg">
                      <Brain className="w-6 h-6" />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium opacity-80">Confidence Level</span>
                      <span className="text-lg font-bold">
                        {(analysisResult.analysis.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-white/60 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-indigo-500 to-purple-500 shadow-sm"
                        style={{ width: `${analysisResult.analysis.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Probability Distribution */}
                {analysisResult.analysis.probabilities && (
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-600" />
                      Probability Distribution
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(analysisResult.analysis.probabilities)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([label, prob], idx) => (
                          <div key={label} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">{label}</span>
                              <span className="text-sm font-bold text-indigo-600">
                                {(prob * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                  idx === 0 
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500' 
                                    : 'bg-gradient-to-r from-gray-400 to-gray-500'
                                }`}
                                style={{ width: `${prob * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Analyzed
                    </span>
                    <span>{new Date(analysisResult.analysis.analyzedAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Export Button */}
                <button
                  onClick={exportResults}
                  className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 transition-all shadow-sm hover:shadow"
                >
                  <Download className="w-4 h-4" />
                  Export Results
                </button>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Brain className="w-10 h-10 text-indigo-400 opacity-50" />
                </div>
                <p className="font-medium">Ready for Analysis</p>
                <p className="text-sm mt-1">Fill in the patient data and click analyze</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};

export default ReportAnalysis;
