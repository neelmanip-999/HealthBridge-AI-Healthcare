const express = require('express');
const router = express.Router();
const HospitalAccount = require('../models/HospitalAccount');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const verifyToken = require('../middleware/auth');

// Hospital Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, latitude, longitude, address, phone, specialties, beds, emergencyServices } = req.body;

        if (!name || !email || !password || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }

        // Check if hospital already exists
        const existingHospital = await HospitalAccount.findOne({ email });
        if (existingHospital) {
            return res.status(400).json({ message: 'Hospital already registered with this email' });
        }

        // Hash password
        const hashedPassword = await bcryptjs.hash(password, 10);

        const newHospital = new HospitalAccount({
            name,
            email,
            password: hashedPassword,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            address,
            phone,
            specialties: specialties || [],
            beds: beds || 0,
            emergencyServices: emergencyServices || false,
            role: 'hospital'
        });

        await newHospital.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: newHospital._id, role: 'hospital', email: newHospital.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Hospital registered successfully',
            token,
            hospital: {
                id: newHospital._id,
                name: newHospital.name,
                email: newHospital.email,
                role: 'hospital'
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Hospital Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        const hospital = await HospitalAccount.findOne({ email });
        if (!hospital) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcryptjs.compare(password, hospital.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: hospital._id, role: 'hospital', email: hospital.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            hospital: {
                id: hospital._id,
                name: hospital.name,
                email: hospital.email,
                role: 'hospital'
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get hospital details
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const hospital = await HospitalAccount.findById(req.user.id);
        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }
        res.status(200).json(hospital);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update hospital details
router.put('/update', verifyToken, async (req, res) => {
    try {
        const { name, address, phone, specialties, beds, emergencyServices, latitude, longitude } = req.body;
        
        const updateData = {};
        if (name) updateData.name = name;
        if (address) updateData.address = address;
        if (phone) updateData.phone = phone;
        if (specialties) updateData.specialties = specialties;
        if (beds) updateData.beds = beds;
        if (emergencyServices !== undefined) updateData.emergencyServices = emergencyServices;
        if (latitude !== undefined && longitude !== undefined) {
            updateData.location = {
                type: 'Point',
                coordinates: [longitude, latitude]
            };
        }

        const hospital = await HospitalAccount.findByIdAndUpdate(req.user.id, updateData, { new: true });
        res.status(200).json({ message: 'Hospital updated successfully', hospital });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
