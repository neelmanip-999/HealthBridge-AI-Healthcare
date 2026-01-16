// HealthBridge/frontend/src/pages/HomePage.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
// 🛑 FIX: Changed 'Pills' to the correct icon name, 'Pill'
import { Stethoscope, Heart, Pill, Building2 } from 'lucide-react'; 

const RoleCard = ({ title, description, icon: Icon, color }) => {
    // Determine the color classes using full strings for better JIT compatibility
    const baseColor = color === 'indigo' ? 'indigo' : color === 'green' ? 'green' : color === 'yellow' ? 'yellow' : 'blue';

    const iconColor = `text-${baseColor}-600`;
    const borderColor = `border-${baseColor}-500`;
    const iconBgColor = `bg-${baseColor}-100`;
    const iconBgHoverColor = `hover:bg-${baseColor}-200`;

    return (
        <div className={`group p-6 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border-t-4 ${borderColor} transform transition-all duration-500 hover:scale-[1.05] hover:shadow-2xl hover:-translate-y-1.5 hover-lift card-hover relative overflow-hidden`} style={{
            '--glow-color': color === 'indigo' ? 'rgb(99, 102, 241)' : color === 'green' ? 'rgb(34, 197, 94)' : color === 'yellow' ? 'rgb(234, 179, 8)' : 'rgb(59, 130, 246)'
        }}>
            {/* Glow border effect on hover */}
            <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} style={{
                boxShadow: `inset 0 0 0 2px var(--glow-color), 0 0 20px var(--glow-color)`
            }}></div>
            {/* Background gradient overlay */}
            <div className={`absolute inset-0 bg-linear-to-br from-${baseColor}-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            
            {/* Icon container */}
            <div className={`inline-flex items-center justify-center w-14 h-14 ${iconBgColor} ${iconBgHoverColor} rounded-2xl mb-5 transition-all duration-300 group-hover:scale-110`}>
                <Icon className={`h-7 w-7 ${iconColor} transition-colors duration-300`} />
            </div>
            
            <h5 className="mb-3 text-2xl font-bold tracking-tight text-gray-800 group-hover:text-gray-900 transition-colors duration-300">{title}</h5>
            <p className="font-normal text-gray-600 mb-6 text-sm leading-relaxed group-hover:text-gray-700 transition-colors duration-300">{description}</p>
            
            {/* Decorative elements */}
            <div className={`absolute top-4 right-4 w-20 h-20 bg-${baseColor}-200/20 rounded-full -z-10 group-hover:scale-150 transition-transform duration-700`}></div>
            <div className={`absolute bottom-4 left-4 w-12 h-12 bg-${baseColor}-300/20 rounded-full -z-10 group-hover:scale-125 transition-transform duration-500`}></div>
        </div>
    );
};


const HomePage = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
      </div>
      
      <div className="text-center mb-16 relative z-10 animate-fadeInUp">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-6 animate-bounce">
          <Stethoscope className="h-10 w-10 text-indigo-600" />
        </div>
        <h1 className="text-7xl font-extrabold text-gray-900 mb-6 text-shadow">
          Welcome to <span className="gradient-text">HealthBridge</span>
        </h1>
        <p className="text-2xl text-gray-600 font-light max-w-3xl mx-auto leading-relaxed">
          Your comprehensive healthcare ecosystem connecting doctors, patients, and pharmacies in real-time
        </p>
        <div className="mt-8 flex justify-center space-x-4 text-sm text-gray-500">
          <span className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Real-time Communication
          </span>
          <span className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            Secure Platform
          </span>
          <span className="flex items-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
            Integrated Services
          </span>
        </div>
      </div>

      <div className="max-w-6xl w-full">
        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 relative z-10">
          <div className="animate-slideInRight" style={{ animationDelay: '0.1s' }}>
            <RoleCard 
              title="Doctor Portal"
              description="Manage your availability, profile, and consult with patients via live chat."
              icon={Stethoscope}
              color="indigo"
            />
          </div>
          <div className="animate-slideInRight" style={{ animationDelay: '0.2s' }}>
            <RoleCard 
              title="Patient Portal"
              description="Find available specialists, view real-time status, and start a secure consultation."
              icon={Heart}
              color="green"
            />
          </div>
          <div className="animate-slideInRight" style={{ animationDelay: '0.3s' }}>
            <RoleCard 
              title="Pharmacy Portal"
              description="Manage drug inventory, stock levels, pricing, and update expiry dates."
              icon={Pill} 
              color="yellow"
            />
          </div>
          <div className="animate-slideInRight" style={{ animationDelay: '0.4s' }}>
            <RoleCard 
              title="Hospital Portal"
              description="Register your hospital, manage details, and reach patients on the map."
              icon={Building2} 
              color="blue"
            />
          </div>
        </div>

        {/* Unified Login Button */}
        <div className="flex justify-center animate-slideInRight mt-8" style={{ animationDelay: '0.5s' }}>
          <button 
            onClick={handleLoginClick}
            type="button" 
            className="bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold py-4 px-12 rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105 flex items-center space-x-3 text-lg cursor-pointer z-20 relative"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            <span>Unified Login</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-20 text-center text-gray-600 relative z-10">
        <p className="text-sm font-medium mb-4">
          © 2024 HealthBridge. Connecting healthcare professionals worldwide.
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-xs">
          <a href="#privacy" className="hover:text-indigo-600 transition-colors duration-300 font-medium">
            Privacy Policy
          </a>
          <span className="text-gray-400">|</span>
          <a href="#terms" className="hover:text-indigo-600 transition-colors duration-300 font-medium">
            Terms & Conditions
          </a>
          <span className="text-gray-400">|</span>
          <a href="mailto:support@healthbridge.com" className="hover:text-indigo-600 transition-colors duration-300 font-medium">
            Contact & Support
          </a>
          <span className="text-gray-400">|</span>
          <a href="https://github.com/neelmanip-999/HealthBridge-AI-Healthcare" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors duration-300 font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
