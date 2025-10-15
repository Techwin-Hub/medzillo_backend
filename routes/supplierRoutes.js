const express = require('express');
const router = express.Router();
const {
    getAllSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
} = require('../controllers/supplierController');
const { protect, isPharmacistOrAdmin } = require('../middleware/authMiddleware');

router.use(protect); // Protect all supplier routes

router.route('/')
    .get(getAllSuppliers)
    .post(isPharmacistOrAdmin, createSupplier);

router.route('/:supplierId')
    .put(isPharmacistOrAdmin, updateSupplier)
    .delete(isPharmacistOrAdmin, deleteSupplier);

module.exports = router;
