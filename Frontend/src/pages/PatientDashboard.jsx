import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  HeartPulse, Stethoscope, Pill, FileText, MapPin, Calendar, Clock, Video,
  Trash2, LogOut, PhoneIncoming, Check, X, Wifi, Brain,
  Droplet, Calculator, Plus, Minus, LayoutGrid, Activity, 
  AlertTriangle, UploadCloud, Sparkles // <--- Added Sparkles for AI Card
} from "lucide-react";
import { getPatientAppointments, cancelAppointment } from "../services/api";
import { useSocket } from "../context/SocketContext";

// --- CUSTOM HOOKS ---

function useAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPatientAppointments();
      const activeAppointments = (res.data || []).filter(apt => 
        apt.status !== 'completed' && apt.status !== 'cancelled'
      );
      setAppointments(activeAppointments);
    } catch (err) {
      console.error("Failed to fetch appointments", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = (id) => {
    setAppointments((prev) => prev.filter((a) => a._id !== id));
  };

  return { appointments, loading, error, fetch, setAppointments, remove };
}

// --- REAL FUNCTIONAL COMPONENTS ---

const HydrationTracker = () => {
  const [count, setCount] = useState(() => parseInt(localStorage.getItem('water_count')) || 0);
  const target = 8;

  useEffect(() => {
    localStorage.setItem('water_count', count);
  }, [count]);

  return (
    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 h-full flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div>
            <h4 className="font-bold text-blue-900 flex items-center gap-2 text-lg"><Droplet className="w-5 h-5 fill-blue-500 text-blue-500"/> Hydration</h4>
            <p className="text-xs text-blue-600 mt-1">Daily Target: {target} glasses</p>
        </div>
        <span className="text-2xl font-black text-blue-600">{count}<span className="text-sm text-blue-400 font-medium">/{target}</span></span>
      </div>
      
      <div className="relative h-4 bg-blue-200 rounded-full overflow-hidden mb-6">
        <div className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min((count / target) * 100, 100)}%` }}></div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => setCount(Math.max(0, count - 1))} className="flex-1 py-2 bg-white text-blue-500 rounded-xl font-bold shadow-sm hover:bg-blue-100 transition"><Minus className="w-4 h-4 mx-auto"/></button>
        <button onClick={() => setCount(count + 1)} className="flex-1 py-2 bg-blue-500 text-white rounded-xl font-bold shadow-blue-200 shadow-lg hover:bg-blue-600 transition"><Plus className="w-4 h-4 mx-auto"/></button>
      </div>
    </div>
  );
};

const MedicineManager = () => {
  const [meds, setMeds] = useState(() => JSON.parse(localStorage.getItem('patient_meds')) || []);
  const [newMed, setNewMed] = useState("");
  const [newTime, setNewTime] = useState("");

  useEffect(() => {
    localStorage.setItem('patient_meds', JSON.stringify(meds));
  }, [meds]);

  const addMed = (e) => {
    e.preventDefault();
    if (!newMed) return;
    setMeds([...meds, { id: Date.now(), name: newMed, time: newTime || "Anytime", taken: false }]);
    setNewMed("");
    setNewTime("");
  };

  const toggleMed = (id) => {
    setMeds(meds.map(m => m.id === id ? { ...m, taken: !m.taken } : m));
  };

  const deleteMed = (id) => {
    setMeds(meds.filter(m => m.id !== id));
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
      <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg"><Pill className="w-5 h-5 text-purple-500"/> Daily Medicines</h4>
      
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 custom-scrollbar pr-2 max-h-[200px]">
        {meds.length === 0 && <p className="text-gray-400 text-sm text-center italic mt-4">No medicines added yet.</p>}
        {meds.map((med) => (
          <div key={med.id} className={`flex items-center justify-between p-3 rounded-xl transition-all border ${med.taken ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100 hover:border-purple-200'}`}>
            <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleMed(med.id)}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${med.taken ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
                {med.taken && <Check className="w-3 h-3 text-white" />}
              </div>
              <div>
                <p className={`font-bold text-sm ${med.taken ? 'text-green-800 line-through opacity-60' : 'text-gray-800'}`}>{med.name}</p>
                <p className="text-[10px] text-gray-500">{med.time}</p>
              </div>
            </div>
            <button onClick={() => deleteMed(med.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4"/></button>
          </div>
        ))}
      </div>

      <form onSubmit={addMed} className="flex gap-2 mt-auto">
        <input type="text" placeholder="Pill name" className="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-purple-300" value={newMed} onChange={e => setNewMed(e.target.value)} />
        <input type="text" placeholder="Time" className="w-20 bg-gray-50 px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-purple-300" value={newTime} onChange={e => setNewTime(e.target.value)} />
        <button type="submit" className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition"><Plus className="w-5 h-5"/></button>
      </form>
    </div>
  );
};

const BMICalculator = () => {
  const [h, setH] = useState('');
  const [w, setW] = useState('');
  const [bmi, setBmi] = useState(null);

  const calc = () => {
    if(h && w) {
      const val = (w / ((h/100) ** 2)).toFixed(1);
      setBmi(val);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
      <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg"><Calculator className="w-5 h-5 text-orange-500"/> BMI Calculator</h4>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Height (cm)</label>
                <input type="number" placeholder="175" className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-100 transition" value={h} onChange={e => setH(e.target.value)}/>
            </div>
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Weight (kg)</label>
                <input type="number" placeholder="70" className="w-full p-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-100 transition" value={w} onChange={e => setW(e.target.value)}/>
            </div>
        </div>
        
        {bmi ? (
          <div className="bg-orange-50 text-orange-800 p-4 rounded-xl text-center animate-in zoom-in">
            <p className="text-xs text-orange-500 font-bold uppercase mb-1">Your BMI Score</p>
            <p className="text-3xl font-black">{bmi}</p>
            <p className="text-sm font-medium mt-1">{bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal Weight' : 'Overweight'}</p>
            <button onClick={() => setBmi(null)} className="mt-3 text-xs underline text-orange-600 hover:text-orange-800">Recalculate</button>
          </div>
        ) : (
          <button onClick={calc} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition shadow-lg shadow-gray-200">Calculate BMI</button>
        )}
      </div>
    </div>
  );
};

// --- CORE COMPONENTS ---

const DashboardCard = ({ title, Icon, colorKey, description, onClick }) => {
  const colors = {
    indigo: "bg-indigo-100 text-indigo-600 border-indigo-500",
    red: "bg-red-100 text-red-600 border-red-500",
    yellow: "bg-yellow-100 text-yellow-600 border-yellow-500",
    purple: "bg-purple-100 text-purple-600 border-purple-500",
    green: "bg-green-100 text-green-600 border-green-500",
    teal: "bg-teal-100 text-teal-600 border-teal-500",
    orange: "bg-orange-100 text-orange-600 border-orange-500", // New color for AI Decoder
  };
  const c = colors[colorKey];

  return (
    <button onClick={onClick} className="group w-full text-left bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-40">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-transparent to-gray-50 rounded-bl-full transition-transform group-hover:scale-110`}></div>
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${c.split(' ')[0]} ${c.split(' ')[1]} mb-3 group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{title}</h3>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>
      </div>
    </button>
  );
};

const AppointmentCard = ({ apt, onJoin, onCancel }) => {
  const dateStr = new Date(apt.date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className="relative">
            <img src={apt.doctorId?.image || "https://cdn-icons-png.flaticon.com/512/377/377429.png"} alt="Dr" className="w-14 h-14 rounded-full object-cover border-2 border-indigo-50" />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
        </div>
        <div>
          <h4 className="font-bold text-gray-900 text-lg">Dr. {apt.doctorId?.name}</h4>
          <p className="text-indigo-600 font-medium text-xs">{apt.doctorId?.specialization}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded"><Calendar className="h-3 w-3" /> {dateStr}</span>
            <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded"><Clock className="h-3 w-3" /> {apt.timeSlot}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
        <button onClick={() => onJoin(apt)} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 transition">
          <Video className="h-4 w-4" /> Join Call
        </button>
        <button onClick={() => onCancel(apt._id)} className="p-2.5 text-red-400 bg-red-50 hover:bg-red-100 rounded-xl transition"><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket(); 
  const patient = JSON.parse(localStorage.getItem("user") || "null");
  const { appointments, loading, fetch, setAppointments, remove } = useAppointments();
  
  const [activeTab, setActiveTab] = useState("overview"); 
  const [incomingSession, setIncomingSession] = useState(null); 

  const nextAppt = useMemo(() => {
    if(!appointments.length) return null;
    return appointments.sort((a,b) => new Date(a.date) - new Date(b.date)).find(a => new Date(a.date) >= new Date());
  }, [appointments]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (socket && isConnected && patient?._id) {
        socket.emit('join_room', patient._id);
        const handleReq = (data) => setIncomingSession(data);
        socket.on('session_request', handleReq);
        return () => socket.off('session_request', handleReq);
    }
  }, [socket, isConnected, patient?._id]);

  const handleJoin = (apt) => navigate(`/patient/chat/${apt.doctorId._id}`, { state: { doctorData: apt.doctorId } });
  const handleCancel = async (id) => { if(window.confirm("Cancel this appointment?")) { await cancelAppointment(id); remove(id); } };
  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/"); };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-sans text-gray-900 relative">
      
      {/* FLOATING AI BUTTON */}
      <button onClick={() => navigate("/patient/ai-assistant")} className="fixed bottom-8 right-8 z-40 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform">
        <Brain className="w-6 h-6 animate-pulse" />
      </button>

      {/* INCOMING CALL MODAL */}
      {incomingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce"><PhoneIncoming className="w-12 h-12 text-green-600" /></div>
                <h3 className="text-2xl font-bold mb-2">Incoming Call</h3>
                <p className="text-gray-600 mb-8">Dr. {incomingSession.doctorName} is calling...</p>
                <div className="flex gap-4">
                    <button onClick={() => setIncomingSession(null)} className="flex-1 py-3 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200"><X className="w-5 h-5 inline mr-2"/> Decline</button>
                    <button onClick={() => { navigate(`/patient/chat/${incomingSession.doctorId}`); setIncomingSession(null); }} className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 shadow-lg"><Check className="w-5 h-5 inline mr-2"/> Accept</button>
                </div>
            </div>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-end bg-gradient-to-r from-gray-900 to-gray-800 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 p-4 opacity-10"><HeartPulse className="w-64 h-64" /></div>
        <div className="relative z-10">
            <p className="text-gray-400 font-medium mb-1">Welcome back,</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{patient?.name || "Patient"}</h1>
            <div className="flex gap-3">
                <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md`}>
                    <Wifi className="w-3 h-3" /> {isConnected ? 'Online' : 'Connecting...'}
                </span>
                <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 hover:bg-red-500/40 transition">
                    <LogOut className="w-3 h-3" /> Logout
                </button>
            </div>
        </div>
        
        {/* TAB NAVIGATION */}
        <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-xl mt-6 md:mt-0 relative z-10">
            {['overview', 'health', 'appointments'].map(tab => (
                <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-white text-gray-900 shadow-md' : 'text-gray-300 hover:text-white'}`}
                >
                    {tab}
                </button>
            ))}
        </div>
      </header>

      {/* --- TAB CONTENT --- */}
      <main className="max-w-7xl mx-auto min-h-[500px]">
        
        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                {/* Next Appointment Banner */}
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 bg-indigo-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden flex items-center justify-between">
                        <div className="relative z-10">
                            <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Next Appointment</p>
                            {nextAppt ? (
                                <div>
                                    <h3 className="text-2xl font-bold">Dr. {nextAppt.doctorId?.name}</h3>
                                    <p className="text-indigo-100 flex items-center gap-2 mt-1"><Clock className="w-4 h-4"/> {new Date(nextAppt.date).toLocaleDateString()} at {nextAppt.timeSlot}</p>
                                </div>
                            ) : (
                                <div>
                                    <h3 className="text-xl font-bold">No upcoming visits</h3>
                                    <p className="text-indigo-200 text-sm mt-1">Book a consultation to get started.</p>
                                </div>
                            )}
                        </div>
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm relative z-10 cursor-pointer hover:bg-white/30 transition" onClick={() => nextAppt ? handleJoin(nextAppt) : navigate('/patient/doctors')}>
                            {nextAppt ? <Video className="w-6 h-6"/> : <Calendar className="w-6 h-6"/>}
                        </div>
                    </div>
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4 flex-1">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><p className="text-gray-500 text-xs font-bold uppercase">Total Visits</p><p className="text-2xl font-black text-gray-800">{appointments.length + 5}</p></div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><p className="text-gray-500 text-xs font-bold uppercase">Pending</p><p className="text-2xl font-black text-indigo-600">{appointments.length}</p></div>
                    </div>
                </div>

                {/* 7 CARDS GRID (Included New Feature) */}
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><LayoutGrid className="w-5 h-5 text-indigo-600"/> Quick Access</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DashboardCard title="Find a Doctor" Icon={Stethoscope} colorKey="indigo" description="Browse specialists & book appointments." onClick={() => navigate("/patient/doctors")} />
                    <DashboardCard title="Medical History" Icon={HeartPulse} colorKey="red" description="View diagnoses and prescriptions." onClick={() => navigate("/patient/medical-history")} />
                    <DashboardCard title="Pharmacy" Icon={Pill} colorKey="yellow" description="Order medicines online." onClick={() => navigate("/patient/pharmacy-catalog")} />
                    <DashboardCard title="AI Assistant" Icon={Brain} colorKey="purple" description="Check symptoms instantly." onClick={() => navigate("/patient/ai-assistant")} />
                    
                    {/* CARD 5: Your Existing ML Analysis */}
                    <DashboardCard title="Report Analysis" Icon={FileText} colorKey="green" description="ML prediction from lab reports." onClick={() => navigate("/patient/report-analysis")} />
                    
                    <DashboardCard title="Route Finder" Icon={MapPin} colorKey="teal" description="Find nearby clinics." onClick={() => navigate("/patient/map")} />
                    
                    {/* CARD 7: NEW AI Decoder */}
                    <DashboardCard title="AI Report Decoder" Icon={Sparkles} colorKey="orange" description="Simple explanation of complex reports." onClick={() => navigate("/patient/report-decoder")} />
                </div>
            </div>
        )}

        {/* 2. HEALTH TOOLS TAB */}
        {activeTab === 'health' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-right-4 duration-500">
                <div className="h-80"><HydrationTracker /></div>
                <div className="h-80"><MedicineManager /></div>
                <div className="h-80"><BMICalculator /></div>
                
                {/* EMERGENCY SOS CARD */}
                <div className="col-span-1 md:col-span-3 bg-red-50 p-6 rounded-2xl border border-red-100 text-center flex flex-col items-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mb-2"/>
                    <h3 className="text-red-900 font-bold text-lg">Emergency SOS</h3>
                    <p className="text-red-700 text-sm mb-4">Click below to call emergency services instantly.</p>
                    <button onClick={() => window.location.href = "tel:102"} className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-red-700 shadow-lg shadow-red-200 transition-transform active:scale-95">
                        CALL AMBULANCE (102)
                    </button>
                </div>
            </div>
        )}

        {/* 3. APPOINTMENTS TAB */}
        {activeTab === 'appointments' && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Your Schedule</h2>
                    <button onClick={fetch} className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100">Refresh List</button>
                </div>
                {loading ? (
                    <div className="text-center py-20"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div></div>
                ) : appointments.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4"/>
                        <p className="text-gray-500 font-medium">No active appointments.</p>
                        <button onClick={() => navigate("/patient/doctors")} className="mt-4 text-indigo-600 font-bold hover:underline">Find a Doctor</button>
                    </div>
                ) : (
                    appointments.map((apt) => <AppointmentCard key={apt._id} apt={apt} onJoin={handleJoin} onCancel={handleCancel} />)
                )}
            </div>
        )}

      </main>
    </div>
  );
};

export default PatientDashboard;