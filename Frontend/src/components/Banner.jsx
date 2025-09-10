import React from 'react';
import { assets } from '../assets/assets_frontend/assets';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Banner = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="flex bg-primary rounded-2xl px-6 sm:px-10 md:px-14 lg:px-12 my-20 md:mx-10 overflow-hidden relative"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      {/* Left Side */}
      <div className="flex-1 py-10 sm:py-12 md:py-16 lg:py-24 lg:pl-5">
        <motion.div
          className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold text-white"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <p>Book Appointment</p>
          <p className="mt-4">With 100+ Trusted Doctors</p>
        </motion.div>

        <motion.button
          onClick={() => {
            navigate('/login');
            scrollTo(0, 0);
          }}
          className="bg-white text-sm sm:text-base text-gray-700 font-medium px-8 py-3 rounded-full mt-6 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          Create Account
        </motion.button>
      </div>

      {/* Right Side */}
      <motion.div
        className="hidden md:block md:w-1/2 lg:w-[370px] relative"
        initial={{ opacity: 0, x: 40 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        viewport={{ once: true }}
      >
        <img
          className="w-full absolute bottom-0 right-0 max-w-md drop-shadow-xl"
          src={assets.appointment_img}
          alt="Appointment Illustration"
        />
      </motion.div>
    </motion.div>
  );
};

export default Banner;

