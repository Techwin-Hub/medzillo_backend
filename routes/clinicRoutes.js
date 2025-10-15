const express = require('express');
const router = express.Router();
const { getClinicProfile, updateClinicProfile } = require('../controllers/clinicController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.route('/profile')
    .get(protect, getClinicProfile)
    .put(protect, isAdmin, updateClinicProfile);

module.exports = router;
