const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// 1. BOOK APPOINTMENT
exports.bookAppointment = async (req, res) => {
    try {
        const { doctorId, date, timeSlot } = req.body;
        const patientId = req.user.id; 

        // Double-check availability backend-side (Security)
        const existingAppointment = await Appointment.findOne({ 
            doctorId, 
            date, 
            timeSlot, 
            status: { $ne: 'cancelled' } // Ignore cancelled slots
        });

        if (existingAppointment) {
            return res.status(400).json({ message: 'This time slot is already booked.' });
        }

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        const newAppointment = new Appointment({
            patientId,
            doctorId,
            date,
            timeSlot,
            status: 'pending',
            paymentStatus: 'unpaid'
        });

        const savedAppointment = await newAppointment.save();

        res.status(200).json({ 
            message: 'Appointment initialized', 
            appointment: savedAppointment,
            fees: doctor.fees 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// 2. CONFIRM PAYMENT
exports.confirmPayment = async (req, res) => {
    try {
        const { appointmentId, paymentId } = req.body;
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        appointment.paymentStatus = 'paid';
        appointment.status = 'scheduled';
        appointment.paymentId = paymentId; 

        await appointment.save();

        res.status(200).json({ message: 'Payment successful, appointment confirmed!', appointment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// 3. GET APPOINTMENTS FOR DOCTOR
exports.getDoctorAppointments = async (req, res) => {
    try {
        const doctorId = req.user.id; 
        const appointments = await Appointment.find({ doctorId })
            .populate('patientId', 'name email') 
            .sort({ date: 1, timeSlot: 1 });
        res.json(appointments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// 4. GET APPOINTMENTS FOR PATIENT
exports.getPatientAppointments = async (req, res) => {
    try {
        const patientId = req.user.id; 
        const appointments = await Appointment.find({ patientId })
            .populate('doctorId', 'name specialization image')
            .sort({ date: -1 });
        res.json(appointments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- NEW FUNCTION: GET BOOKED SLOTS ---
exports.getBookedSlots = async (req, res) => {
    try {
        const { doctorId, date } = req.query;

        if (!doctorId || !date) {
            return res.status(400).json({ message: "Doctor ID and Date are required" });
        }

        // Find all active appointments for this doctor on this date
        const appointments = await Appointment.find({
            doctorId,
            date: new Date(date).toISOString(), // Ensure format matches DB
            status: { $ne: 'cancelled' } // Don't block cancelled slots
        }).select('timeSlot'); // We only need the time strings

        // Extract just the time slots into an array (e.g., ["10:00 AM", "11:00 AM"])
        const bookedSlots = appointments.map(app => app.timeSlot);

        res.status(200).json(bookedSlots);
    } catch (err) {
        console.error("Error fetching slots:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// 5. CANCEL APPOINTMENT (Restricted)
exports.cancelAppointment = async (req, res) => {
    try {
        const appointmentId = req.params.id;
        
        // Optional: Add check here if you want to strictly prevent doctors via API
        // if (req.user.role === 'doctor') return res.status(403).json({ message: "Doctors cannot cancel appointments." });

        await Appointment.findByIdAndDelete(appointmentId);
        res.status(200).json({ message: 'Appointment cancelled successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// 6. COMPLETE APPOINTMENT
exports.completeAppointment = async (req, res) => {
    try {
        const { appointmentId, diagnosis, prescription } = req.body;
        const appointment = await Appointment.findByIdAndUpdate(
            appointmentId,
            { 
                status: 'completed',
                diagnosis: diagnosis,
                prescription: prescription
            },
            { new: true }
        );

        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        res.status(200).json({ success: true, message: 'Consultation completed', data: appointment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error completing appointment', error: error.message });
    }
};