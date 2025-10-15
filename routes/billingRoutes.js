const express = require('express');
const router = express.Router();
const {
    getAllBills,
    createBill
} = require('../controllers/billingController');
// UPDATED: We now import 'canManageBilling' instead of the old rule
const { protect, canManageBilling } = require('../middleware/authMiddleware');

router.use(protect); // This correctly protects all billing routes

router.route('/')
    .get(getAllBills)
    // UPDATED: We now use the new rule that includes doctors
    .post(canManageBilling, createBill);

module.exports = router;
