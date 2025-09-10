import React from 'react';
import { motion } from 'framer-motion';
import contact_image from '../assets/assets_frontend/contact_image.png'; // adjust path as needed

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const Contact = () => {
  return (
    <div className="px-6 md:px-16 lg:px-24 overflow-hidden">
      {/* Heading */}
      <motion.div
        className="text-center text-3xl pt-12 text-gray-600 font-semibold"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <p>
          CONTACT <span className="text-gray-800 font-bold">US</span>
        </p>
        <motion.div
          className="w-20 h-1 bg-primary mx-auto mt-3 rounded-full"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6 }}
        ></motion.div>
      </motion.div>

      {/* Contact Section */}
      <motion.div
        className="my-14 flex flex-col justify-center md:flex-row gap-12 mb-28 text-base"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.img
          className="w-full md:max-w-[400px] rounded-2xl shadow-lg"
          src={contact_image}
          alt="Contact Us"
          variants={fadeInUp}
        />

        <motion.div
          className="flex flex-col justify-center items-start gap-6 text-gray-600"
          variants={fadeInUp}
        >
          <p className="text-lg font-semibold text-gray-700">📍 Our Office</p>
          <p className="text-gray-500 leading-relaxed">
            54709 Willms Station <br /> Vrindavan
          </p>
          <p className="text-gray-500 leading-relaxed">
            Tel: (415) 555-0132 <br /> Email: neelmanipandey@gmail.com
          </p>

          <div>
            <p className="font-semibold text-lg text-gray-700">💼 Careers at HealthBridge</p>
            <p className="text-gray-500 mt-2">
              Discover opportunities to grow with our passionate and innovative
              team.
            </p>
          </div>

          <motion.button
            className="border border-black px-8 py-3 text-sm font-medium rounded-xl hover:bg-black hover:text-white transition-all duration-500 cursor-pointer shadow-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Explore Jobs
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Contact;


