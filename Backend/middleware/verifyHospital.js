const jwt = require('jsonwebtoken');

const verifyHospital = (req, res, next) => {
    try {
        const token = req.header('auth-token') || req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        if (decoded.role !== 'hospital') {
            return res.status(403).json({ message: 'Access denied. Hospital role required' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = verifyHospital;
