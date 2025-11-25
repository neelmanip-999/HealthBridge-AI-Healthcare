import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  HeartPulse,
  Stethoscope,
  Pill,
  Brain,
  FileText,
  MapPin,
  Calendar,
  Clock,
  Video,
  Trash2,
  LogOut,
} from "lucide-react";
import { getPatientAppointments, cancelAppointment } from "../services/api";

/**
 * Custom hook to manage appointments
 */
function useAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPatientAppointments();
      setAppointments(res.data || []);
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

/**
 * Tailwind-safe color map
 */
const COLOR_MAP = {
  indigo: {
    border: "border-indigo-500",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
  red: {
    border: "border-red-500",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
  },
  yellow: {
    border: "border-yellow-500",
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
  },
  purple: {
    border: "border-purple-500",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  green: {
    border: "border-green-500",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  teal: {
    border: "border-teal-500",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
  },
};

/**
 * DashboardCard - clickable card used in dashboard grid
 */
const DashboardCard = ({ title, Icon, colorKey = "indigo", link, description, onClick }) => {
  const c = COLOR_MAP[colorKey] || COLOR_MAP.indigo;
  const handleClick = () => {
    if (onClick) return onClick();
    if (link) return (window.location.href = link); // fallback
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className={`group w-full text-left bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-md border-l-4 ${c.border} transition-transform transform hover:-translate-y-1`}
    >
      <div className="flex items-center gap-4">
        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-lg ${c.iconBg} group-hover:scale-105 transition-transform`}>
          <Icon className={`h-6 w-6 ${c.iconColor}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  );
};

/**
 * AppointmentCard - shows a single appointment with actions
 */
const AppointmentCard = ({ apt, onJoin, onCancel }) => {
  const dateStr = new Date(apt.date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const paymentClass = apt.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700";

  return (
    <article className="bg-white border border-gray-100 rounded-xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-4">
        <img
          src={apt.doctorId.image || "https://cdn-icons-png.flaticon.com/512/377/377429.png"}
          alt={`Dr. ${apt?.doctorId?.name || "Doctor"}`}
          className="w-16 h-16 rounded-full object-cover border-2 border-indigo-50"
        />
        <div>
          <h4 className="text-lg font-semibold text-gray-900">Dr. {apt.doctorId.name}</h4>
          <p className="text-indigo-600 font-medium text-sm">{apt.doctorId.specialization}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {dateStr}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {apt.timeSlot}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4 md:mt-0">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${paymentClass}`}>
          {apt.paymentStatus}
        </span>

        <button
          onClick={() => onJoin(apt)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-2 rounded-lg shadow hover:opacity-95 transition"
          aria-label="Join consultation"
        >
          <Video className="h-4 w-4" /> Join
        </button>

        <button
          onClick={() => onCancel(apt._id)}
          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition border border-transparent hover:border-red-100"
          title="Cancel Appointment"
          aria-label="Cancel appointment"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
};

/**
 * Main PatientDashboard component
 */
const PatientDashboard = () => {
  const navigate = useNavigate();
  const patient = JSON.parse(localStorage.getItem("user") || "null");
  const { appointments, loading, error, fetch, setAppointments, remove } = useAppointments();

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      await cancelAppointment(id);
      remove(id);
    } catch (err) {
      console.error("Cancel failed", err);
      alert("Failed to cancel appointment. Please try again.");
    }
  };

  const handleJoin = (appointment) => {
    navigate(`/patient/chat/${appointment.doctorId._id}`, { state: { doctorData: appointment.doctorId } });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6 md:p-10 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white/80 backdrop-blur-sm p-6 md:p-8 rounded-2xl mb-8 border-t-4 border-green-600 shadow">
        <div className="flex items-center gap-4 mb-4 lg:mb-0">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-lg">
            <HeartPulse className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Patient Dashboard</h1>
            <p className="text-sm text-gray-500">Your Health & Wellness Center</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" aria-hidden />
            <span className="text-gray-600 font-medium">Hello, {patient?.name || "Patient"}!</span>
          </div>

          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {/* Dashboard cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <DashboardCard
            title="Find a Doctor"
            Icon={Stethoscope}
            colorKey="indigo"
            description="View specialists, their status, and availability."
            onClick={() => navigate("/patient/doctors")}
          />

          <DashboardCard
            title="Medical History"
            Icon={HeartPulse}
            colorKey="red"
            description="Review and update your past records."
            onClick={() => navigate("/patient/medical-history")} // FIXED: Matches App.jsx
          />

          <DashboardCard
            title="Pharmacy Catalog"
            Icon={Pill}
            colorKey="yellow"
            description="Browse available medicines and prices."
            onClick={() => navigate("/patient/pharmacy-catalog")} // FIXED: Matches App.jsx
          />

          <DashboardCard
            title="AI Health Assistant"
            Icon={Brain}
            colorKey="purple"
            description="Get instant health answers and find nearby facilities."
            onClick={() => navigate("/patient/ai-assistant")}
          />

          <DashboardCard
            title="Report Analysis"
            Icon={FileText}
            colorKey="green"
            description="AI-powered analysis of your medical reports and lab results."
            onClick={() => navigate("/patient/report-analysis")}
          />

          <DashboardCard
            title="Route Finder"
            Icon={MapPin}
            colorKey="teal"
            description="Find routes to hospitals, pharmacies, and save your locations."
            onClick={() => navigate("/patient/map")}
          />
        </div>

        {/* Consultations / Appointments */}
        <section className="bg-white/80 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow border border-green-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg">
              <Stethoscope className="h-5 w-5 text-indigo-600" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Your Consultations</h2>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={fetch}
                className="text-sm px-3 py-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                aria-label="Refresh appointments"
              >
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading appointments...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">Failed to load appointments. Try refreshing.</div>
          ) : appointments.length === 0 ? (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-lg border-2 border-dashed border-indigo-200 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
                <Stethoscope className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700">No Active Consultations</h3>
              <p className="text-gray-500 mt-2 mb-4">Start a new consultation by finding a doctor and booking an appointment.</p>
              <button onClick={() => navigate("/patient/doctors")} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">
                Find a Doctor
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <AppointmentCard key={apt._id} apt={apt} onJoin={handleJoin} onCancel={handleCancel} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default PatientDashboard;