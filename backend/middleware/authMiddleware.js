const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, email: true, name: true, role: true, clinicId: true }
            });

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

const isPharmacistOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'Admin' || req.user.role === 'Pharmacist')) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized. Admin or Pharmacist role required.' });
    }
};

// --- NEW FUNCTION ADDED HERE ---
// This new rule allows Doctors, in addition to Admins and Pharmacists,
// to access the routes it protects.
const canManageBilling = (req, res, next) => {
    if (req.user && (req.user.role === 'Admin' || req.user.role === 'Pharmacist' || req.user.role === 'Doctor')) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized. Admin, Pharmacist, or Doctor role required.' });
    }
};


// --- MODULE EXPORTS UPDATED HERE ---
module.exports = { protect, isAdmin, isPharmacistOrAdmin, canManageBilling };
