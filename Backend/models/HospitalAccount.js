const mongoose = require('mongoose');

const PricingItemSchema = new mongoose.Schema({
    serviceType: {
        type: String,
        required: true,
        enum: ['Disease Treatment', 'Test', 'Consultation', 'Surgery', 'Admission', 'Other']
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: String
    }
});

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
    pricing: [PricingItemSchema],
    role: {
        type: String,
        default: 'hospital'
    }
}, { timestamps: true });

HospitalAccountSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('HospitalAccount', HospitalAccountSchema);
