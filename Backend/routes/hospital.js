const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');
const HospitalAccount = require('../models/HospitalAccount');
const verifyToken = require('../middleware/auth');

// Add a new hospital
router.post('/add', verifyToken, async (req, res) => {
    try {
        const { name, latitude, longitude } = req.body;
        if (!name || !latitude || !longitude) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newHospital = new Hospital({
            name,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            addedBy: req.user.id
        });

        await newHospital.save();
        res.status(201).json({ message: 'Hospital added successfully', hospital: newHospital });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all registered hospitals (from both Hospital and HospitalAccount models)
router.get('/all', async (req, res) => {
    try {
        // Fetch hospitals added by doctors
        const doctorAddedHospitals = await Hospital.find();

        // Fetch hospital accounts registered via registration (with pricing)
        const hospitalAccounts = await HospitalAccount.find().select('name email phone address location specialties beds emergencyServices pricing');

        // Format hospital accounts to match the Hospital model structure
        const formattedAccounts = hospitalAccounts.map(hospital => ({
            _id: hospital._id,
            name: hospital.name,
            location: hospital.location,
            email: hospital.email,
            phone: hospital.phone,
            address: hospital.address,
            specialties: hospital.specialties,
            beds: hospital.beds,
            emergencyServices: hospital.emergencyServices,
            pricing: hospital.pricing || [],
            type: 'hospital_account'
        }));

        // Combine both lists
        const allHospitals = [...doctorAddedHospitals, ...formattedAccounts];

        res.status(200).json(allHospitals);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;