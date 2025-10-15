// HealthBridge/frontend/src/pages/HomePage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
// 🛑 FIX: Changed 'Pills' to the correct icon name, 'Pill'
import { Stethoscope, Heart, Pill } from 'lucide-react'; 

const RoleCard = ({ title, description, link, icon: Icon, color }) => {
    // Determine the color classes using full strings for better JIT compatibility
    const baseColor = color === 'indigo' ? 'indigo' : color === 'green' ? 'green' : 'yellow';

    const iconColor = `text-${baseColor}-600`;
    const borderColor = `border-${baseColor}-500`;
    const bgColor = `bg-${baseColor}-600`;
    const hoverBgColor = `hover:bg-${baseColor}-700`;
    const textColor = `text-${baseColor}-600`;
    const hoverTextColor = `hover:text-${baseColor}-800`;
    const hoverBorderColor = `border-${baseColor}-600`;
    const hoverBgLight = `hover:bg-${baseColor}-50`;
    const iconBgColor = `bg-${baseColor}-100`;
    const iconBgHoverColor = `hover:bg-${baseColor}-200`;

    return (
        <div className={`group p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border-t-4 ${borderColor} transform transition-all duration-500 hover:scale-[1.05] hover:shadow-3xl hover-lift card-hover relative overflow-hidden`}>
            {/* Background gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br from-${baseColor}-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            
            {/* Icon container */}
            <div className={`inline-flex items-center justify-center w-16 h-16 ${iconBgColor} ${iconBgHoverColor} rounded-2xl mb-6 transition-all duration-300 group-hover:scale-110`}>
                <Icon className={`h-8 w-8 ${iconColor} transition-colors duration-300`} />
            </div>
            
            <h5 className="mb-4 text-3xl font-bold tracking-tight text-gray-800 group-hover:text-gray-900 transition-colors duration-300">{title}</h5>
            <p className="font-normal text-gray-600 mb-8 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">{description}</p>
            
            <div className="space-y-3 relative z-10">
                <Link to={`${link}`} className="block">
                    <button className={`w-full ${bgColor} ${hoverBgColor} text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] btn-ripple`}>
                        <span className="flex items-center justify-center">
                            Login
                            <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </span>
                    </button>
                </Link>
                <Link to={`${link.replace('login', 'register')}`} className="block">
                    <button className={`w-full ${textColor} border-2 ${hoverBorderColor} ${hoverBgLight} font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-[1.02] group-hover:shadow-lg`}>
                        <span className="flex items-center justify-center">
                            Register
                            <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </span>
                    </button>
                </Link>
            </div>
            
            {/* Decorative elements */}
            <div className={`absolute top-4 right-4 w-20 h-20 bg-${baseColor}-200/20 rounded-full -z-10 group-hover:scale-150 transition-transform duration-700`}></div>
            <div className={`absolute bottom-4 left-4 w-12 h-12 bg-${baseColor}-300/20 rounded-full -z-10 group-hover:scale-125 transition-transform duration-500`}></div>
        </div>
    );
};


const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl w-full relative z-10">
        <div className="animate-slideInRight" style={{ animationDelay: '0.1s' }}>
          <RoleCard 
            title="Doctor Portal"
            description="Manage your availability, profile, and consult with patients via live chat."
            link="/doctor/login"
            icon={Stethoscope}
            color="indigo"
          />
        </div>
        <div className="animate-slideInRight" style={{ animationDelay: '0.2s' }}>
          <RoleCard 
            title="Patient Portal"
            description="Find available specialists, view real-time status, and start a secure consultation."
            link="/patient/login"
            icon={Heart}
            color="green"
          />
        </div>
        <div className="animate-slideInRight" style={{ animationDelay: '0.3s' }}>
          <RoleCard 
            title="Pharmacy Portal"
            description="Manage drug inventory, stock levels, pricing, and update expiry dates."
            link="/pharmacy/login"
            icon={Pill} 
            color="yellow"
          />
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-20 text-center text-gray-500 relative z-10">
        <p className="text-sm">
          © 2024 HealthBridge. Connecting healthcare professionals worldwide.
        </p>
      </div>
    </div>
  );
};

export default HomePage;
