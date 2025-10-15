// routes/appointmentRoutes.js
const express = require('express');
const router = express.Router();
const {
    getAllAppointments,
    createAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    addVitalsToAppointment, // <-- NEW
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Apply protection to all routes in this file

router.route('/')
    .get(getAllAppointments)
    .post(createAppointment);

router.route('/:appointmentId/status')
    .put(updateAppointmentStatus);

// --- NEW ENDPOINT FOR ADDING VITALS ---
router.route('/:appointmentId/vitals')
    .post(addVitalsToAppointment);

router.route('/:appointmentId')
    .delete(deleteAppointment);

module.exports = router;
