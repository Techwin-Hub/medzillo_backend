const prisma = require('../lib/prisma');

// @desc    Get all suppliers for a clinic
// @route   GET /api/v1/suppliers
// @access  Private
const getAllSuppliers = async (req, res) => {
    try {
        const suppliers = await prisma.supplier.findMany({
            where: { clinicId: req.user.clinicId },
            orderBy: { name: 'asc' },
        });
        res.status(200).json(suppliers);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching suppliers.' });
    }
};

// @desc    Create a new supplier
// @route   POST /api/v1/suppliers
// @access  Private/PharmacistOrAdmin
const createSupplier = async (req, res) => {
    const { name, contactPerson, mobile, address, gstin, paymentTerms } = req.body;
    if (!name || !contactPerson || !mobile) {
        return res.status(400).json({ message: 'Name, contact person, and mobile are required.' });
    }
    try {
        const newSupplier = await prisma.supplier.create({
            data: {
                name, contactPerson, mobile, address, gstin, paymentTerms,
                clinicId: req.user.clinicId,
            },
        });
        res.status(201).json(newSupplier);
    } catch (error) {
        res.status(500).json({ message: 'Server error creating supplier.' });
    }
};

// @desc    Update a supplier
// @route   PUT /api/v1/suppliers/:supplierId
// @access  Private/PharmacistOrAdmin
const updateSupplier = async (req, res) => {
    try {
        const supplier = await prisma.supplier.findFirst({
            where: { id: req.params.supplierId, clinicId: req.user.clinicId },
        });
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found.' });
        }
        const updatedSupplier = await prisma.supplier.update({
            where: { id: req.params.supplierId },
            data: req.body,
        });
        res.status(200).json(updatedSupplier);
    } catch (error) {
        res.status(500).json({ message: 'Server error updating supplier.' });
    }
};

// @desc    Delete a supplier
// @route   DELETE /api/v1/suppliers/:supplierId
// @access  Private/PharmacistOrAdmin
const deleteSupplier = async (req, res) => {
    try {
        // Check if any batches are linked to this supplier
        const batchCount = await prisma.batch.count({
            where: { supplierId: req.params.supplierId },
        });

        if (batchCount > 0) {
            return res.status(400).json({ message: 'Cannot delete supplier. They are linked to existing medicine batches.' });
        }

        await prisma.supplier.delete({
            where: { id: req.params.supplierId, clinicId: req.user.clinicId },
        });
        res.status(200).json({ message: 'Supplier deleted successfully.' });
    } catch (error) {
        // P2025 is Prisma's error code for "record to delete does not exist"
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Supplier not found.' });
        }
        res.status(500).json({ message: 'Server error deleting supplier.' });
    }
};

module.exports = {
    getAllSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
};
