const express = require('express');
const router = express.Router();
const {
    getAllPatients,
    getPatientById,
    createPatient,
    bulkImportPatients,
    updatePatient,
    deletePatient,
} = require('../controllers/patientController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getAllPatients)
    .post(protect, createPatient);

router.route('/import')
    .post(protect, isAdmin, bulkImportPatients);

router.route('/:patientId')
    .get(protect, getPatientById)
    .put(protect, updatePatient)
    .delete(protect, isAdmin, deletePatient);

module.exports = router;
