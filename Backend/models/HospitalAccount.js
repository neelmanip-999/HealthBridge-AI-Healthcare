const mongoose = require('mongoose');

const HospitalAccountSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    address: {
        type: String
    },
    phone: {
        type: String
    },
    specialties: [{
        type: String
    }],
    beds: {
        type: Number
    },
    emergencyServices: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        default: 'hospital'
    }
}, { timestamps: true });

HospitalAccountSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('HospitalAccount', HospitalAccountSchema);
