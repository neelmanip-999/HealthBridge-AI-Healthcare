// backend/routes/maps.js (Using OpenStreetMap Nominatim - 100% FREE)
const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');

/**
 * @route   POST /api/maps/nearby
 * @desc    Find nearby hospitals or pharmacies using OpenStreetMap Nominatim API (FREE)
 * @access  Private (requires authentication)
 */
router.post('/nearby', auth, async (req, res) => {
    try {
        const { latitude, longitude, type } = req.body;

        // Validate input
        if (!latitude || !longitude || !type) {
            return res.status(400).json({
                success: false,
                message: 'Latitude, longitude, and type are required'
            });
        }

        // Validate type
        if (type !== 'hospital' && type !== 'pharmacy') {
            return res.status(400).json({
                success: false,
                message: 'Type must be either "hospital" or "pharmacy"'
            });
        }

        console.log(`Maps search request from user ${req.user.id}: ${type} near ${latitude}, ${longitude}`);

        // Map type to OpenStreetMap amenity tags
        const amenityType = type === 'hospital' ? 'hospital' : 'pharmacy';

        // Call OpenStreetMap Overpass API (completely free, no API key needed)
        // Search within 5km radius
        const radius = 5000; // 5km in meters

        const overpassQuery = `
            [out:json][timeout:25];
            (
              node["amenity"="${amenityType}"](around:${radius},${latitude},${longitude});
              way["amenity"="${amenityType}"](around:${radius},${latitude},${longitude});
              relation["amenity"="${amenityType}"](around:${radius},${latitude},${longitude});
            );
            out body;
            >;
            out skel qt;
        `;

        const response = await axios.post(
            'https://overpass-api.de/api/interpreter',
            overpassQuery,
            {
                headers: {
                    'Content-Type': 'text/plain'
                },
                timeout: 10000 // 10 second timeout
            }
        );

        if (response.data && response.data.elements) {
            // Filter and format the results
            const places = response.data.elements
                .filter(element => element.lat && element.lon && element.tags)
                .slice(0, 15) // Limit to 15 results
                .map(element => {
                    const tags = element.tags || {};
                    return {
                        name: tags.name || `${type.charAt(0).toUpperCase() + type.slice(1)}`,
                        address: [
                            tags['addr:street'],
                            tags['addr:housenumber'],
                            tags['addr:city']
                        ].filter(Boolean).join(', ') || 'Address not available',
                        lat: element.lat,
                        lng: element.lon,
                        phone: tags.phone || null,
                        website: tags.website || null,
                        openingHours: tags.opening_hours || null,
                        placeId: element.id
                    };
                });

            console.log(`Found ${places.length} ${type}(s) nearby`);

            return res.status(200).json({
                success: true,
                places: places,
                count: places.length
            });

        } else {
            return res.status(200).json({
                success: true,
                places: [],
                count: 0,
                message: `No ${type}s found within 5km. Try a different location.`
            });
        }

    } catch (error) {
        console.error('Maps API Error:', error.message);
        
        // Handle timeout errors
        if (error.code === 'ECONNABORTED') {
            return res.status(408).json({
                success: false,
                message: 'Map service timeout. Please try again.'
            });
        }

        // Handle network errors
        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                message: 'Failed to fetch nearby places from map service',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch nearby places. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;