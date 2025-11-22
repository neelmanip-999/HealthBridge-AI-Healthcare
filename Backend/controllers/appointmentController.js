const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// 1. BOOK APPOINTMENT
exports.bookAppointment = async (req, res) => {
    try {
        const { doctorId, date, timeSlot } = req.body;
        const patientId = req.user.id; 

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        const existingAppointment = await Appointment.findOne({ 
            doctorId, 
            date, 
            timeSlot, 
            status: 'scheduled' 
        });

        if (existingAppointment) {
            return res.status(400).json({ message: 'This time slot is already booked.' });
        }

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
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        appointment.paymentStatus = 'paid';
        appointment.status = 'scheduled';
        appointment.paymentId = paymentId; 

        await appointment.save();

        res.status(200).json({ 
            message: 'Payment successful, appointment confirmed!', 
            appointment 
        });

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

// 5. CANCEL APPOINTMENT
exports.cancelAppointment = async (req, res) => {
    try {
        const appointmentId = req.params.id;
        await Appointment.findByIdAndDelete(appointmentId);
        res.status(200).json({ message: 'Appointment cancelled successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};