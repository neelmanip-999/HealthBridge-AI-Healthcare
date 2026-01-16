import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Brain, AlertCircle, CheckCircle, Loader2, ArrowLeft, 
  RefreshCw, Activity, Heart, Thermometer, Droplet, Gauge, User, 
  TrendingUp, AlertTriangle, Sparkles, Info, BarChart3, Zap, Shield, FileDown
} from 'lucide-react';
import { analyzeReport, checkMLServiceHealth } from '../services/api';
import jsPDF from 'jspdf';

const ReportAnalysis = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState({});
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [mlServiceStatus, setMlServiceStatus] = useState(null);
  const [inputErrors, setInputErrors] = useState({});
  const [showFeatureImportance, setShowFeatureImportance] = useState(false);

  // Normal ranges for validation
  const normalRanges = {
    Age: { min: 0, max: 150, unit: 'years' },
    BloodPressure: { min: 70, max: 200, unit: 'mmHg', optimal: { min: 90, max: 120 } },
    HeartRate: { min: 40, max: 200, unit: 'bpm', optimal: { min: 60, max: 100 } },
    Cholesterol: { min: 100, max: 400, unit: 'mg/dL', optimal: { min: 0, max: 200 } },
    Glucose: { min: 70, max: 300, unit: 'mg/dL', optimal: { min: 70, max: 100 } },
    BMI: { min: 10, max: 50, unit: '', optimal: { min: 18.5, max: 24.9 } }
  };

  // Grouped medical report fields for better organization
  const fieldGroups = [
    {
      title: 'Patient Information',
      icon: User,
      fields: [
        { key: 'Age', label: 'Age', type: 'number', icon: User, required: true },
        { key: 'Gender', label: 'Gender', type: 'select', options: ['Male', 'Female'], icon: User, required: true },
      ]
    },
    {
      title: 'Vital Signs',
      icon: Activity,
      fields: [
        { key: 'BloodPressure', label: 'Blood Pressure (mmHg)', type: 'number', placeholder: 'e.g., 120', icon: Gauge, required: true },
        { key: 'HeartRate', label: 'Heart Rate (bpm)', type: 'number', placeholder: 'e.g., 72', icon: Heart, required: true },
        { key: 'BMI', label: 'BMI (Body Mass Index)', type: 'number', placeholder: 'e.g., 25', icon: TrendingUp, required: true },
      ]
    },
    {
      title: 'Lab Results',
      icon: Droplet,
      fields: [
        { key: 'Cholesterol', label: 'Cholesterol (mg/dL)', type: 'number', placeholder: 'e.g., 200', icon: Droplet, required: true },
        { key: 'Glucose', label: 'Blood Glucose (mg/dL)', type: 'number', placeholder: 'e.g., 95', icon: Droplet, required: true },
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

  const validateInput = (key, value) => {
    const errors = { ...inputErrors };
    
    if (!value && fieldGroups.some(g => g.fields.some(f => f.key === key && f.required))) {
      errors[key] = 'This field is required';
      setInputErrors(errors);
      return false;
    }

    if (value && normalRanges[key]) {
      const numValue = parseFloat(value);
      const range = normalRanges[key];
      
      if (isNaN(numValue)) {
        errors[key] = 'Please enter a valid number';
        setInputErrors(errors);
        return false;
      }
      
      if (numValue < range.min || numValue > range.max) {
        errors[key] = `Value should be between ${range.min}-${range.max} ${range.unit}`;
        setInputErrors(errors);
        return false;
      }
      
      delete errors[key];
      setInputErrors(errors);
    } else if (value) {
      delete errors[key];
      setInputErrors(errors);
    }
    
    return true;
  };

  const getValueStatus = (key, value) => {
    if (!value || !normalRanges[key]) return null;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;
    
    const range = normalRanges[key];
    if (range.optimal) {
      if (numValue >= range.optimal.min && numValue <= range.optimal.max) {
        return 'optimal';
      } else if (numValue < range.optimal.min) {
        return 'low';
      } else {
        return 'high';
      }
    }
    return null;
  };

  const checkServiceStatus = () => {
    checkMLServiceHealth()
      .then(res => {
        setMlServiceStatus(res.data);
      })
      .catch(err => {
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

  useEffect(() => {
    checkServiceStatus();
  }, []);

  const handleFieldChange = (key, value) => {
    setReportData(prev => ({
      ...prev,
      [key]: value
    }));
    validateInput(key, value);
  };

  const handleAnalyze = async () => {
    // Validate all required fields
    const requiredFields = fieldGroups.flatMap(g => 
      g.fields.filter(f => f.required).map(f => f.key)
    );
    
    const missingFields = requiredFields.filter(key => !reportData[key]);
    
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    if (Object.keys(inputErrors).length > 0) {
      setError('Please fix input errors before analyzing');
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
    setInputErrors({});
  };

  const exportResultsAsPDF = () => {
    if (!analysisResult) return;
    
    const result = analysisResult.analysis;
    const analyzedDate = new Date(result.analyzedAt).toLocaleString();
    const doc = new jsPDF('p', 'mm', 'a4');
    let yPos = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 12;
    const contentWidth = pageWidth - (margin * 2);
    const reportId = `HB-${Date.now()}`;
    
    const checkPageBreak = (requiredSpace = 10) => {
      if (yPos + requiredSpace > doc.internal.pageSize.getHeight() - 15) {
        addFooter();
        doc.addPage();
        yPos = 10;
        addHeaderOnNewPage();
      }
    };
    
    const addText = (text, fontSize = 10, isBold = false, color = [0, 0, 0]) => {
      checkPageBreak(fontSize + 2);
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.setFont(undefined, isBold ? 'bold' : 'normal');
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, yPos);
      yPos += lines.length * (fontSize * 0.35) + 2;
    };
    
    // Professional header design
    const addHeaderOnNewPage = () => {
      // Hospital-style header bar
      doc.setFillColor(26, 54, 93); // Professional dark blue
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      // Logo area
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('HealthBridge AI', margin + 2, 10);
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text('Advanced Medical Diagnostic System', margin + 2, 16);
      
      // Report ID on right
      doc.setFontSize(7);
      doc.setTextColor(180, 180, 200);
      doc.text(`Report ID: ${reportId}`, pageWidth - margin - 50, 10);
      doc.text(`Date: ${analyzedDate}`, pageWidth - margin - 50, 16);
      
      yPos = 36;
    };
    
    const addFooter = () => {
      const footerY = doc.internal.pageSize.getHeight() - 10;
      doc.setDrawColor(180, 180, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);
      
      doc.setFontSize(6);
      doc.setTextColor(120, 120, 140);
      doc.setFont(undefined, 'normal');
      doc.text(`Page ${doc.internal.getNumberOfPages()}`, margin, footerY);
      doc.text('Confidential - For Medical Professional Use Only', pageWidth / 2 - 40, footerY);
      doc.text(`© HealthBridge AI ${new Date().getFullYear()}`, pageWidth - margin - 35, footerY);
    };
    
    const drawSectionDivider = () => {
      checkPageBreak(2);
      doc.setDrawColor(200, 200, 220);
      doc.setLineWidth(0.3);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 6;
    };
    
    const drawSectionTitle = (title) => {
      checkPageBreak(8);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(26, 54, 93);
      doc.text(title, margin + 1, yPos);
      yPos += 2.5;
      
      doc.setDrawColor(26, 54, 93);
      doc.setLineWidth(0.8);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 6;
    };
    
    // Initial header
    addHeaderOnNewPage();
    
    // SECTION 1: PATIENT VITAL INFORMATION
    drawSectionTitle('CLINICAL ASSESSMENT');
    
    // Primary diagnosis box - Professional styling
    checkPageBreak(15);
    const predictionColor = getDiseaseColor(result.prediction).includes('green') 
      ? [34, 139, 34] 
      : getDiseaseColor(result.prediction).includes('red')
      ? [178, 34, 34]
      : [184, 134, 11];
    
    // Main diagnosis display - clean white background
    doc.setFillColor(250, 250, 252);
    doc.rect(margin, yPos, contentWidth, 15, 'F');
    
    doc.setDrawColor(200, 200, 220);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPos, contentWidth, 15);
    
    doc.setTextColor(100, 100, 120);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('PRIMARY DIAGNOSIS', margin + 2, yPos + 3);
    
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(26, 54, 93);
    doc.text(result.prediction, margin + 2, yPos + 10);
    
    const confidence = result.confidence * 100;
    let confidenceLevel = confidence >= 85 ? 'High' : confidence >= 70 ? 'Moderate' : 'Low';
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Confidence Level: ${confidenceLevel} (${confidence.toFixed(1)}%)`, margin + 2, yPos + 14);
    
    yPos += 18;
    drawSectionDivider();
    
    // SECTION 2: DIFFERENTIAL DIAGNOSES
    if (result.probabilities) {
      drawSectionTitle('DIFFERENTIAL DIAGNOSES');
      
      const sortedProbs = Object.entries(result.probabilities)
        .filter(([, prob]) => prob > 0)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6);
      
      // Create professional table-like display
      sortedProbs.forEach(([condition, prob], index) => {
        checkPageBreak(7);
        const percentage = (prob * 100).toFixed(1);
        
        // Alternating row background
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 252);
          doc.rect(margin, yPos - 0.5, contentWidth, 5.5, 'F');
        }
        
        // Condition name and rank
        doc.setFontSize(10);
        doc.setFont(undefined, index === 0 ? 'bold' : 'normal');
        doc.setTextColor(26, 54, 93);
        doc.text(`${index + 1}. ${condition.substring(0, 22)}`, margin + 2, yPos + 2);
        
        // Percentage - right aligned
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.setFont(undefined, 'bold');
        const percentText = `${percentage}%`;
        doc.text(percentText, pageWidth - margin - 12, yPos + 2, { align: 'right' });
        
        // Mini bar chart with better spacing
        const barX = margin + 50;
        const barWidth = 35;
        doc.setFillColor(220, 220, 230);
        doc.rect(barX, yPos + 0.5, barWidth, 2.5, 'F');
        
        let barColor = index === 0 ? [26, 54, 93] : [150, 150, 180];
        doc.setFillColor(barColor[0], barColor[1], barColor[2]);
        doc.rect(barX, yPos + 0.5, (barWidth * prob), 2.5, 'F');
        
        yPos += 6;
      });
      
      drawSectionDivider();
    }
    
    // SECTION 3: PATIENT DATA SUMMARY
    drawSectionTitle('VITAL SIGNS & HEALTH METRICS');
    
    const vitalFields = ['Age', 'Gender', 'BloodPressure', 'HeartRate', 'Cholesterol', 'Glucose', 'BMI'];
    const vitalLabels = {
      'Age': 'Age',
      'Gender': 'Gender',
      'BloodPressure': 'Blood Pressure',
      'HeartRate': 'Heart Rate',
      'Cholesterol': 'Cholesterol',
      'Glucose': 'Blood Glucose',
      'BMI': 'BMI'
    };
    const vitalUnits = {
      'Age': 'years',
      'BloodPressure': 'mmHg',
      'HeartRate': 'bpm',
      'Cholesterol': 'mg/dL',
      'Glucose': 'mg/dL',
      'BMI': ''
    };
    
    let vitalsCount = 0;
    Object.entries(reportData).forEach(([key, value]) => {
      if (vitalFields.includes(key)) {
        checkPageBreak(5);
        const unit = vitalUnits[key] ? ` ${vitalUnits[key]}` : '';
        const displayValue = `${value}${unit}`;
        
        if (vitalsCount % 2 === 0) {
          doc.setFillColor(250, 250, 252);
          doc.rect(margin, yPos - 0.5, contentWidth, 4.5, 'F');
        }
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(60, 60, 80);
        doc.text(`${vitalLabels[key]}:`, margin + 1, yPos + 2);
        
        doc.setFont(undefined, 'bold');
        doc.setTextColor(26, 54, 93);
        doc.text(displayValue, pageWidth - margin - 25, yPos + 2);
        
        yPos += 5;
        vitalsCount++;
      }
    });
    
    drawSectionDivider();
    
    // SECTION 4: SYMPTOMS
    const symptomFields = ['Fever', 'Cough', 'Fatigue', 'Headache', 'Nausea', 'ShortnessBreath'];
    const reportedSymptoms = Object.entries(reportData)
      .filter(([key, value]) => symptomFields.includes(key) && (value === '1' || value === 1))
      .map(([key]) => key);
    
    if (reportedSymptoms.length > 0) {
      drawSectionTitle('REPORTED SYMPTOMS');
      
      checkPageBreak(reportedSymptoms.length * 3.5 + 2);
      reportedSymptoms.forEach((symptom, index) => {
        doc.setFontSize(9);
        doc.setTextColor(26, 54, 93);
        doc.setFont(undefined, 'normal');
        doc.text(`✓ ${symptom}`, margin + 2, yPos);
        yPos += 3.5;
      });
      
      drawSectionDivider();
    }
    
    // SECTION 5: KEY HEALTH FACTORS (Actual Input Values)
    if (result.modelInfo?.featureImportance) {
      drawSectionTitle('KEY HEALTH FACTORS');
      
      const topFeatures = Object.entries(result.modelInfo.featureImportance)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6);
      
      const vitalUnits = {
        'Age': 'years',
        'BloodPressure': 'mmHg',
        'HeartRate': 'bpm',
        'Cholesterol': 'mg/dL',
        'Glucose': 'mg/dL',
        'BMI': '',
        'Gender': ''
      };
      
      topFeatures.forEach(([feature, importance], index) => {
        checkPageBreak(10);
        
        const displayValue = reportData[feature] || 'N/A';
        const unit = vitalUnits[feature] ? ` ${vitalUnits[feature]}` : '';
        const valueText = `${displayValue}${unit}`;
        
        // Card background - increased height
        doc.setFillColor(240, 250, 245);
        doc.rect(margin, yPos - 0.5, contentWidth, 8, 'F');
        
        // Card border
        doc.setDrawColor(34, 139, 34);
        doc.setLineWidth(0.4);
        doc.rect(margin, yPos - 0.5, contentWidth, 8);
        
        // Rank circle - centered vertically
        doc.setFillColor(34, 139, 34);
        doc.circle(margin + 3.5, yPos + 3.5, 1.8, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text(`${index + 1}`, margin + 3.5, yPos + 4.2, { align: 'center' });
        
        // Feature name - centered vertically in box
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(34, 139, 34);
        doc.text(`${feature}`, margin + 9, yPos + 2.5);
        
        // Actual Value - centered vertically
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(26, 54, 93);
        const valueX = pageWidth - margin - 8;
        doc.text(`${valueText}`, valueX, yPos + 3.5, { align: 'right' });
        
        // Description text - centered vertically
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Measured Value', margin + 9, yPos + 5.5);
        
        yPos += 9.5;
      });
      
      drawSectionDivider();
    }
    
    // SECTION 6: MEDICAL DISCLAIMER
    drawSectionTitle('MEDICAL DISCLAIMER');
    
    doc.setFontSize(7);
    doc.setTextColor(120, 40, 40);
    doc.setFont(undefined, 'bold');
    doc.text('IMPORTANT - PLEASE READ:', margin, yPos);
    yPos += 3;
    
    const disclaimerText = [
      'This report is generated by Artificial Intelligence for informational purposes only.',
      '',
      'It is NOT a substitute for professional medical diagnosis, treatment, or advice from a qualified healthcare provider.',
      '',
      '• Always consult with a licensed physician or healthcare professional',
      '• Seek immediate medical attention for urgent health concerns',
      '• This system analysis should not be solely relied upon for medical decisions',
      '• All medical conditions require personalized professional evaluation'
    ];
    
    doc.setFont(undefined, 'normal');
    doc.setTextColor(80, 80, 100);
    disclaimerText.forEach(line => {
      checkPageBreak(3);
      doc.setFontSize(7.5);
      doc.text(line, margin + 1, yPos);
      yPos += 2.5;
    });
    
    addFooter();
    
    // Save PDF
    doc.save(`HealthBridge-Medical-Report-${reportId}-${new Date().toISOString().split('T')[0]}.pdf`);
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
    setInputErrors({});
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

          {/*ML Service Status */}
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
          {/*Input Section */}
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
                      const value = reportData[field.key] || '';
                      const status = getValueStatus(field.key, value);
                      const hasError = inputErrors[field.key];
                      
                      return (
                        <div key={field.key} className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <FieldIcon className="w-4 h-4 text-indigo-500" />
                            {field.label}
                            {field.required && <span className="text-red-500">*</span>}
                            {normalRanges[field.key] && (
                              <span className="text-xs text-gray-500 ml-auto">
                                ({normalRanges[field.key].min}-{normalRanges[field.key].max} {normalRanges[field.key].unit})
                              </span>
                            )}
                          </label>
                          {field.type === 'select' ? (
                            <select
                              value={value}
                              onChange={(e) => handleFieldChange(field.key, e.target.value)}
                              className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 transition bg-white ${
                                hasError ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <option value="">Select...</option>
                              {field.options.map(opt => (
                                <option key={opt} value={opt}>
                                  {opt === '0' ? 'No' : opt === '1' ? 'Yes' : opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="relative">
                              <input
                                type={field.type}
                                value={value}
                                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                onBlur={(e) => validateInput(field.key, e.target.value)}
                                placeholder={field.placeholder}
                                className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 transition bg-white ${
                                  hasError 
                                    ? 'border-red-300 focus:border-red-500' 
                                    : status === 'optimal'
                                    ? 'border-green-300 focus:border-green-500'
                                    : status === 'high' || status === 'low'
                                    ? 'border-yellow-300 focus:border-yellow-500'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              />
                              {status && (
                                <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                                  status === 'optimal' ? 'text-green-500' : 'text-yellow-500'
                                }`}>
                                  {status === 'optimal' ? (
                                    <CheckCircle className="w-5 h-5" />
                                  ) : (
                                    <AlertTriangle className="w-5 h-5" />
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          {hasError && (
                            <p className="text-xs text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {inputErrors[field.key]}
                            </p>
                          )}
                          {status && !hasError && normalRanges[field.key]?.optimal && (
                            <p className={`text-xs flex items-center gap-1 ${
                              status === 'optimal' ? 'text-green-600' : 'text-yellow-600'
                            }`}>
                              {status === 'optimal' ? (
                                <>
                                  <CheckCircle className="w-3 h-3" />
                                  Within optimal range
                                </>
                              ) : status === 'low' ? (
                                <>
                                  <AlertTriangle className="w-3 h-3" />
                                  Below optimal range
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-3 h-3" />
                                  Above optimal range
                                </>
                              )}
                            </p>
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
                disabled={loading || Object.keys(reportData).length === 0 || Object.keys(inputErrors).length > 0}
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

          {/*Results Section */}
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
                      <BarChart3 className="w-5 h-5 text-indigo-600" />
                      Probability Distribution
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(analysisResult.analysis.probabilities)
                        .filter(([, prob]) => prob > 0) // Filter out zero probabilities
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

                {/* Key Health Factors - Collapsible */}
                {analysisResult.analysis.modelInfo?.featureImportance && (
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200 overflow-hidden">
                    <button
                      onClick={() => setShowFeatureImportance(!showFeatureImportance)}
                      className="w-full flex items-center justify-between p-5 hover:bg-emerald-100/50 transition"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-semibold text-gray-800">Key Health Factors</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-3 py-1 bg-emerald-200 text-emerald-800 rounded-full">
                          Top 6
                        </span>
                        <span className={`text-emerald-600 transition-transform duration-300 ${showFeatureImportance ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </div>
                    </button>
                    {showFeatureImportance && (
                      <div className="px-5 pb-5 border-t border-emerald-200 space-y-3">
                        {Object.entries(analysisResult.analysis.modelInfo.featureImportance)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 6)
                          .map(([feature, importance], idx) => (
                            <div key={feature} className="bg-white rounded-lg p-4 border border-emerald-100 hover:border-emerald-300 transition">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-sm font-bold">
                                    {idx + 1}
                                  </div>
                                  <span className="text-sm font-semibold text-gray-800">{feature}</span>
                                </div>
                                <span className="text-lg font-bold text-emerald-600">
                                  {(importance * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Model Info */}
                {analysisResult.analysis.modelInfo && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-800">Model Information</span>
                    </div>
                    <div className="text-xs text-blue-700 space-y-1">
                      {analysisResult.analysis.modelInfo.modelType && (
                        <p>Type: {analysisResult.analysis.modelInfo.modelType}</p>
                      )}
                      {analysisResult.analysis.modelInfo.nFeatures && (
                        <p>Features: {analysisResult.analysis.modelInfo.nFeatures}</p>
                      )}
                      {analysisResult.analysis.modelInfo.trainedAt && (
                        <p>Trained: {new Date(analysisResult.analysis.modelInfo.trainedAt).toLocaleDateString()}</p>
                      )}
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
                  onClick={exportResultsAsPDF}
                  className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all shadow-sm hover:shadow"
                >
                  <FileDown className="w-4 h-4" />
                  Export Report as PDF
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