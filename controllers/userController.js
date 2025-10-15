const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

// @desc    Get all users for a clinic
// @route   GET /api/v1/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { clinicId: req.user.clinicId },
            select: { id: true, name: true, email: true, role: true, specialty: true, consultationFee: true }
        });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching users.' });
    }
};

// @desc    Get current user's profile
// @route   GET /api/v1/users/me
// @access  Private
const getUserProfile = async (req, res) => {
    // req.user is already attached by the 'protect' middleware
    res.status(200).json(req.user);
};

// @desc    Create a new user
// @route   POST /api/v1/users
// @access  Private/Admin
const createUser = async (req, res) => {
    const { name, email, password, role, specialty, consultationFee } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    try {
        const userExists = await prisma.user.findFirst({
            where: { email, clinicId: req.user.clinicId }
        });

        if (userExists) {
            return res.status(400).json({ message: 'A user with this email already exists in your clinic.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                specialty: role === 'Doctor' ? specialty : null,
                consultationFee: role === 'Doctor' ? consultationFee : null,
                clinicId: req.user.clinicId,
            }
        });

        res.status(201).json({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error creating user.' });
    }
};

// @desc    Update a user
// @route   PUT /api/v1/users/:userId
// @access  Private
const updateUser = async (req, res) => {
    const { userId } = req.params;
    const { name, email, role, password, specialty, consultationFee } = req.body;

    // Authorization: Only admin can edit other users. Users can edit their own profile.
    if (req.user.role !== 'Admin' && req.user.id !== userId) {
        return res.status(403).json({ message: 'Not authorized to update this user.' });
    }

    try {
        const userToUpdate = await prisma.user.findFirst({
            where: { id: userId, clinicId: req.user.clinicId }
        });

        if (!userToUpdate) {
            return res.status(404).json({ message: 'User not found in this clinic.' });
        }

        const updateData = {
            name: name || userToUpdate.name,
            email: email || userToUpdate.email,
            role: role || userToUpdate.role,
            specialty: role === 'Doctor' ? specialty : null,
            consultationFee: role === 'Doctor' ? consultationFee : null,
        };

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: { id: true, name: true, email: true, role: true, specialty: true, consultationFee: true }
        });

        res.status(200).json(updatedUser);

    } catch (error) {
        if (error.code === 'P2002' && error.meta?.target.includes('email')) {
             return res.status(400).json({ message: 'This email is already in use.' });
        }
        res.status(500).json({ message: 'Server error updating user.' });
    }
};


// @desc    Delete a user
// @route   DELETE /api/v1/users/:userId
// @access  Private/Admin
const deleteUser = async (req, res) => {
    const { userId } = req.params;

    if (req.user.id === userId) {
        return res.status(400).json({ message: 'You cannot delete your own admin account.' });
    }

    try {
        await prisma.user.delete({
            where: { id: userId, clinicId: req.user.clinicId }
        });
        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
        res.status(404).json({ message: 'User not found or not in this clinic.' });
    }
};


module.exports = {
    getAllUsers,
    getUserProfile,
    createUser,
    updateUser,
    deleteUser
};
