// routes/medicineRoutes.js
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { protect } = require('../middleware/authMiddleware');

// Apply the protect middleware to all routes in this file
router.use(protect);

// Helper function to calculate total stock from batches
const calculateStock = (batches) => {
    return batches.reduce((acc, batch) => {
        const packQty = Number(batch.packQuantity || 0);
        const packSz = Number(batch.packSize || 0);
        const looseQty = Number(batch.looseQuantity || 0);
        return acc + (packQty * packSz) + looseQty;
    }, 0);
};

// --- Standard CRUD for Medicines ---

// GET /api/v1/medicines - Get all medicines
router.get('/', async (req, res) => {
  try {
    const medicines = await prisma.medicine.findMany({ include: { batches: true } });
    res.json(medicines);
  } catch (error) {
    console.error('Failed to get medicines:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/medicines - Create a new medicine
router.post('/', async (req, res) => {
    // Note: This is for adding a medicine definition, not stock.
    // Stock is added via the /import or /:id/batches endpoints.
    const data = req.body;
    try {
        const newMedicine = await prisma.medicine.create({
            data: {
                ...data,
                totalStockInUnits: 0,
                clinic: { connect: { id: req.user.clinicId } },
            },
        });
        res.status(201).json(newMedicine);
    } catch (error) {
        console.error('Failed to create medicine:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- Batch Management ---

// POST /api/v1/medicines/:id/batches - Add a new batch to a medicine
router.post('/:id/batches', async (req, res) => {
    const { id } = req.params;
    const { supplierId, ...batchData } = req.body;

    try {
        const updatedMedicine = await prisma.medicine.update({
            where: { id },
            data: {
                batches: {
                    create: {
                        ...batchData,
                        supplier: { connect: { id: supplierId } }
                    }
                }
            },
            include: { batches: true }
        });
        
        // Recalculate stock and perform a final update
        const totalStock = calculateStock(updatedMedicine.batches);
        const finalMedicine = await prisma.medicine.update({
            where: { id },
            data: { totalStockInUnits: totalStock },
            include: { batches: true }
        });

        res.status(201).json(finalMedicine);
    } catch (error) {
        console.error(`Failed to add batch to medicine ${id}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- NEW ENDPOINT FOR BULK STOCK IMPORT ---

// POST /api/v1/medicines/import - Bulk import of medicine batches
router.post('/import', async (req, res) => {
    const itemsToImport = req.body; // Expects an array of ProcessedStockItem
    if (!Array.isArray(itemsToImport) || itemsToImport.length === 0) {
        return res.status(400).json({ error: 'Request body must be a non-empty array of stock items.' });
    }

    try {
        const results = await prisma.$transaction(async (tx) => {
            const createdMedicines = [];
            const updatedMedicines = [];

            // Efficiently fetch all required suppliers first
            const supplierNames = [...new Set(itemsToImport.map(item => item.data.supplierName))];
            const suppliers = await tx.supplier.findMany({
                where: { name: { in: supplierNames } }
            });
            const supplierMap = new Map(suppliers.map(s => [s.name.toLowerCase(), s.id]));

            for (const item of itemsToImport) {
                const { status, data, medicineId } = item;
                const supplierId = supplierMap.get(data.supplierName.toLowerCase());

                if (!supplierId) {
                    throw new Error(`Supplier "${data.supplierName}" not found for item "${data.medicineName}".`);
                }
                
                const batchPayload = {
                    supplierId: supplierId,
                    batchNumber: data.batchNumber,
                    purchaseDate: data.purchaseDate ? new Date(data.purchaseDate).toISOString() : new Date().toISOString(),
                    expiryDate: new Date(data.expiryDate).toISOString(),
                    packQuantity: data.packQuantity,
                    looseQuantity: 0,
                    purchaseRate: data.purchaseRate,
                    sellingRate: data.mrp,
                    supplierName: data.supplierName,
                    packSize: data.unitsPerPack,
                };
                
                if (status === 'new_medicine') {
                    const newMedicine = await tx.medicine.create({
                        data: {
                            clinicId: req.body.clinicId, // Assumes clinicId is passed with the request
                            name: data.medicineName,
                            manufacturer: data.manufacturer,
                            composition: data.composition,
                            strength: data.strength,
                            form: data.form,
                            unitType: data.form, // Assuming unitType is same as form for new medicines
                            hsnCode: data.hsnCode,
                            gstRate: data.gstRate,
                            minStockLevel: 10, // Default value
                            totalStockInUnits: data.packQuantity * data.unitsPerPack,
                            batches: { create: [batchPayload] }
                        },
                        include: { batches: true }
                    });
                    createdMedicines.push(newMedicine);

                } else if (status === 'new_batch' && medicineId) {
                    // Create the new batch first
                    await tx.batch.create({
                        data: {
                            medicineId: medicineId,
                            ...batchPayload
                        }
                    });

                    // Then, update the medicine's total stock
                    const medicineToUpdate = await tx.medicine.findUnique({
                        where: { id: medicineId },
                        include: { batches: true }
                    });

                    if (medicineToUpdate) {
                        const newTotalStock = calculateStock(medicineToUpdate.batches);
                        const updated = await tx.medicine.update({
                            where: { id: medicineId },
                            data: { totalStockInUnits: newTotalStock },
                            include: { batches: true }
                        });
                        updatedMedicines.push(updated);
                    }
                }
            }
            return { createdMedicines, updatedMedicines };
        });

        res.status(201).json({ message: 'Stock imported successfully.', details: results });
    } catch (error) {
        console.error('Failed to import stock:', error);
        res.status(500).json({ error: error.message || 'Internal server error during stock import.' });
    }
});


// PUT /api/v1/medicines/:id - Update a medicine
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    // Make sure batches are not passed in the update data, they are managed separately
    delete data.batches;

    try {
        const updatedMedicine = await prisma.medicine.update({
            where: { id },
            data,
            include: { batches: true },
        });
        res.json(updatedMedicine);
    } catch (error) {
        console.error(`Failed to update medicine ${id}:`, error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Medicine not found.' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/v1/medicines/:id - Delete a medicine
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Prisma will cascade delete the batches due to the schema relation
        await prisma.medicine.delete({
            where: { id },
        });
        res.status(204).send(); // No content
    } catch (error) {
        console.error(`Failed to delete medicine ${id}:`, error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Medicine not found.' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});


// DELETE /api/v1/medicines/:id/batches/:batchNumber - Delete a specific batch
router.delete('/:id/batches/:batchNumber', async (req, res) => {
    const { id, batchNumber } = req.params;

    try {
        // First, delete the batch
        await prisma.batch.deleteMany({
            where: {
                medicineId: id,
                batchNumber: batchNumber,
            },
        });

        // Then, find the medicine and its remaining batches to recalculate stock
        const medicine = await prisma.medicine.findUnique({
            where: { id },
            include: { batches: true },
        });

        if (!medicine) {
            return res.status(404).json({ error: 'Medicine not found after batch deletion.' });
        }

        // Recalculate stock and perform a final update
        const totalStock = calculateStock(medicine.batches);
        const updatedMedicine = await prisma.medicine.update({
            where: { id },
            data: { totalStockInUnits: totalStock },
            include: { batches: true },
        });

        res.json(updatedMedicine);
    } catch (error) {
        console.error(`Failed to delete batch ${batchNumber} from medicine ${id}:`, error);
        // Check for specific Prisma error for records not found
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Batch not found or already deleted.' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
