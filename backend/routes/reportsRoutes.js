const express = require('express');
const router = express.Router();
const { getReportsData } = require('../controllers/reportsController');
const { protect, isPharmacistOrAdmin } = require('../middleware/authMiddleware');

// A single, versatile route for all reports
router.route('/')
    .get(protect, isPharmacistOrAdmin, getReportsData);

module.exports = router;
