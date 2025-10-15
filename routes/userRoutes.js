// routes/userRoutes.js (Corrected Version)

const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getUserProfile,
    createUser,
    updateUser,
    deleteUser
} = require('../controllers/userController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.route('/')
    // CORRECTED LINE: The 'isAdmin' middleware has been removed from the GET route.
    // Now any logged-in user can view the list of users in their clinic.
    .get(protect, getAllUsers) 
    .post(protect, isAdmin, createUser);

router.route('/me').get(protect, getUserProfile);

router.route('/:userId')
    .put(protect, updateUser)
    .delete(protect, isAdmin, deleteUser);

module.exports = router;
