const isSuperAdmin = (req, res, next) => {
    // This assumes the 'protect' middleware has already run and attached the user object.
    // For super admin, we might have a different logic, e.g., checking a separate model
    // or a specific role on the user model. For now, we'll assume a 'SuperAdmin' role.
    if (req.user && req.user.role === 'SuperAdmin') {
        next();
    } else {
        // A regular user's token might be valid, but they are not a super admin.
        res.status(403).json({ message: 'Forbidden: Access is restricted to System Administrators.' });
    }
};

module.exports = { isSuperAdmin };