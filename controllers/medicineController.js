const prisma = require('../lib/prisma');

// Helper function to calculate total stock from batches
const calculateStock = (batches) => {
    return batches.reduce((acc, batch) => acc + (Number(batch.packQuantity || 0) * Number(batch.packSize || 0)) + Number(batch.looseQuantity || 0), 0);
};

// @desc    Get all medicines for a clinic
// @route   GET /api/v1/medicines
// @access  Private
const getAllMedicines = async (req, res) => {
    try {
        const medicines = await prisma.medicine.findMany({
            where: { clinicId: req.user.clinicId },
            include: { batches: true }, // Include batches in the response
            orderBy: { name: 'asc' },
        });
        res.status(200).json(medicines);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching medicines.' });
    }
};

// @desc    Create a new medicine
// @route   POST /api/v1/medicines
// @access  Private/PharmacistOrAdmin
const createMedicine = async (req, res) => {
    const { name, manufacturer, composition, strength, form, unitType, hsnCode, gstRate, minStockLevel } = req.body;
    if (!name || !manufacturer) {
        return res.status(400).json({ message: 'Medicine name and manufacturer are required.' });
    }

    try {
        const newMedicine = await prisma.medicine.create({
            data: {
                name, manufacturer, composition, strength, form, unitType, hsnCode, gstRate, minStockLevel,
                totalStockInUnits: 0,
                clinicId: req.user.clinicId,
            },
        });
        res.status(201).json({ ...newMedicine, batches: [] }); // Return with empty batches array for consistency
    } catch (error) {
        res.status(500).json({ message: 'Server error creating medicine.' });
    }
};

// @desc    Update a medicine's details (not stock)
// @route   PUT /api/v1/medicines/:medicineId
// @access  Private/PharmacistOrAdmin
const updateMedicine = async (req, res) => {
    try {
        const updatedMedicine = await prisma.medicine.update({
            where: { id: req.params.medicineId },
            data: req.body,
        });
        res.status(200).json(updatedMedicine);
    } catch (error) {
        res.status(500).json({ message: 'Server error updating medicine.' });
    }
};

// @desc    Delete a medicine
// @route   DELETE /api/v1/medicines/:medicineId
// @access  Private/PharmacistOrAdmin
const deleteMedicine = async (req, res) => {
    try {
        const batchCount = await prisma.batch.count({ where: { medicineId: req.params.medicineId } });
        if (batchCount > 0) {
            return res.status(400).json({ message: 'Cannot delete. Medicine has existing stock batches. Please remove them first.' });
        }
        await prisma.medicine.delete({ where: { id: req.params.medicineId, clinicId: req.user.clinicId } });
        res.status(200).json({ message: 'Medicine deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting medicine.' });
    }
};

// @desc    Add a new batch to a medicine
// @route   POST /api/v1/medicines/:medicineId/batches
// @access  Private/PharmacistOrAdmin
const addBatch = async (req, res) => {
    const { medicineId } = req.params;
    const batchData = req.body;

    try {
        // Use a transaction to ensure both batch creation and stock update happen together
        const [, updatedMedicine] = await prisma.$transaction([
            prisma.batch.create({
                data: {
                    medicineId,
                    ...batchData,
                },
            }),
            prisma.medicine.update({
                where: { id: medicineId },
                data: {
                    totalStockInUnits: {
                        increment: (Number(batchData.packQuantity) * Number(batchData.packSize)) + Number(batchData.looseQuantity || 0),
                    },
                },
            }),
        ]);

        res.status(201).json(updatedMedicine);
    } catch (error) {
        if (error.code === 'P2002') {
             return res.status(409).json({ message: 'This batch number already exists for this medicine.' });
        }
        res.status(500).json({ message: 'Server error adding batch.' });
    }
};

// @desc    Delete a batch from a medicine
// @route   DELETE /api/v1/medicines/:medicineId/batches/:batchId
// @access  Private/PharmacistOrAdmin
const deleteBatch = async (req, res) => {
    const { medicineId, batchId } = req.params;
    
    try {
        const batchToDelete = await prisma.batch.findUnique({ where: { id: batchId } });
        if (!batchToDelete) {
            return res.status(404).json({ message: 'Batch not found.' });
        }

        const stockToRemove = (Number(batchToDelete.packQuantity) * Number(batchToDelete.packSize)) + Number(batchToDelete.looseQuantity);

        const [, updatedMedicine] = await prisma.$transaction([
            prisma.batch.delete({ where: { id: batchId } }),
            prisma.medicine.update({
                where: { id: medicineId },
                data: { totalStockInUnits: { decrement: stockToRemove } },
            }),
        ]);

        res.status(200).json(updatedMedicine);
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting batch.' });
    }
};


module.exports = {
    getAllMedicines,
    createMedicine,
    updateMedicine,
    deleteMedicine,
    addBatch,
    deleteBatch,
};
