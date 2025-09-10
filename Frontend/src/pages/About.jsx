import React from 'react';
import { motion } from 'framer-motion';
import about_image from '../assets/assets_frontend/about_image.png'; // adjust path as needed

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

const About = () => {
  return (
    <div className="px-6 md:px-16 lg:px-24 overflow-hidden">
      {/* Heading */}
      <motion.div
        className="text-center text-3xl pt-12 text-gray-700 font-semibold"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <p>
          ABOUT <span className="text-gray-900 font-bold">US</span>
        </p>
        <motion.div
          className="w-20 h-1 bg-primary mx-auto mt-3 rounded-full"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6 }}
        ></motion.div>
      </motion.div>

      {/* About Section */}
      <motion.div
        className="my-12 flex flex-col md:flex-row gap-12 items-center"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.img
          className="w-full md:max-w-[380px] rounded-2xl shadow-lg"
          src={about_image}
          alt="About Prescripto"
          variants={fadeInUp}
        />
        <motion.div
          className="flex flex-col justify-center gap-6 md:w-2/3 text-base text-gray-600 leading-relaxed"
          variants={fadeInUp}
        >
          <p>
            Welcome to <span className="font-semibold text-gray-800">Prescripto</span>,
            your trusted partner in simplifying healthcare. We believe managing
            appointments, health records, and consultations should be seamless,
            secure, and stress-free.
          </p>
          <p>
            With a strong commitment to innovation, Prescripto integrates the
            latest healthcare technologies to deliver a smooth and personalized
            experience. Whether it’s booking your first appointment, keeping
            track of prescriptions, or staying connected with your doctor,
            Prescripto is here to support you at every stage of your health
            journey.
          </p>
          <div>
            <b className="text-gray-800 text-lg">🌟 Our Vision</b>
            <p className="mt-2">
              To revolutionize healthcare accessibility by bridging the gap
              between patients and providers, empowering every individual to
              take charge of their well-being with ease and confidence.
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Why Choose Us Section */}
      <motion.div
        className="text-center text-2xl font-semibold my-10 text-gray-700"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <p>
          WHY <span className="text-gray-900">CHOOSE US</span>
        </p>
        <div className="w-20 h-1 bg-primary mx-auto mt-3 rounded-full"></div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div
          className="border rounded-2xl p-8 flex flex-col gap-4 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer shadow-md"
          variants={fadeInUp}
          whileHover={{ scale: 1.05 }}
        >
          <b className="text-lg">⚡ Efficiency</b>
          <p>
            Streamlined appointment scheduling that adapts to your busy
            lifestyle, saving you time and hassle.
          </p>
        </motion.div>
        <motion.div
          className="border rounded-2xl p-8 flex flex-col gap-4 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer shadow-md"
          variants={fadeInUp}
          whileHover={{ scale: 1.05 }}
        >
          <b className="text-lg">📍 Convenience</b>
          <p>
            Access a trusted network of doctors and healthcare professionals in
            your area—anytime, anywhere.
          </p>
        </motion.div>
        <motion.div
          className="border rounded-2xl p-8 flex flex-col gap-4 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer shadow-md"
          variants={fadeInUp}
          whileHover={{ scale: 1.05 }}
        >
          <b className="text-lg">🎯 Personalization</b>
          <p>
            Get tailored reminders, recommendations, and health tips designed to
            keep you on track with your wellness goals.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default About;
