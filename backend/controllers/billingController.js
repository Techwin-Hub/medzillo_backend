// controllers/billingController.js (Corrected Version)

const prisma = require('../lib/prisma');

// @desc    Get all bills for a clinic
// @route   GET /api/v1/bills
// @access  Private
const getAllBills = async (req, res) => {
    try {
        const bills = await prisma.bill.findMany({
            where: { clinicId: req.user.clinicId },
            // THIS IS THE FIX: It now includes the list of items for each bill.
            include: {
                patient: {
                    select: { id: true, name: true, mobile: true }
                },
                items: true // This line was missing.
            },
            orderBy: { date: 'desc' },
        });
        res.status(200).json(bills);
    } catch (error) {
        console.error("Error fetching bills:", error);
        res.status(500).json({ message: 'Server error fetching bills.' });
    }
};

// @desc    Create a new bill (Process Sale)
// @route   POST /api/v1/bills
// @access  Private/PharmacistOrAdmin
const createBill = async (req, res) => {
    const {
        patient, items, subTotal, totalAmount, paymentMode, taxDetails, appointmentId
    } = req.body;

    if (!patient || !items || items.length === 0) {
        return res.status(400).json({ message: 'Patient and bill items are required.' });
    }

    try {
        const newBill = await prisma.$transaction(async (tx) => {
            // Step 1: Create the Bill and its items
            const createdBill = await tx.bill.create({
                data: {
                    billNumber: `INV-${Date.now()}`,
                    clinicId: req.user.clinicId,
                    patientId: patient.id,
                    subTotal,
                    totalAmount,
                    paymentMode,
                    taxDetails,
                    appointmentId: appointmentId || null, // Ensure null if undefined
                    items: {
                        create: items.map((item) => ({
                            itemType: item.itemType,
                            itemName: item.itemName,
                            quantity: item.quantity,
                            rate: item.rate,
                            amount: item.amount,
                            gstRate: item.gstRate,
                            isRemovable: item.isRemovable,
                            medicineId: item.medicineId,
                            hsnCode: item.hsnCode,
                            batchNumber: item.batchNumber,
                        }))
                    }
                },
                include: { items: true, patient: true },
            });

            // Step 2: Deduct stock for each medicine item
            for (const item of items) {
                if (item.itemType === 'Medicine' && item.medicineId && item.batchNumber) {
                    const batch = await tx.batch.findFirst({
                        where: {
                            medicineId: item.medicineId,
                            batchNumber: item.batchNumber
                        },
                        include: { medicine: true }
                    });

                    if (!batch) {
                        throw new Error(`Batch ${item.batchNumber} for medicine ${item.itemName} not found.`);
                    }
                    
                    const batchStockInUnits = (batch.packQuantity * batch.packSize) + batch.looseQuantity;
                    if (batchStockInUnits < item.quantity) {
                        throw new Error(`Insufficient stock for ${item.itemName} in batch ${item.batchNumber}. Available: ${batchStockInUnits}, Required: ${item.quantity}.`);
                    }

                    await tx.medicine.update({
                        where: { id: item.medicineId },
                        data: {
                            totalStockInUnits: {
                                decrement: item.quantity,
                            },
                        },
                    });

                    const newBatchStockInUnits = batchStockInUnits - item.quantity;
                    const newPackQuantity = Math.floor(newBatchStockInUnits / batch.packSize);
                    const newLooseQuantity = newBatchStockInUnits % batch.packSize;
                    
                    await tx.batch.update({
                        where: { id: batch.id },
                        data: {
                            packQuantity: newPackQuantity,
                            looseQuantity: newLooseQuantity,
                        },
                    });
                }
            }

            if (appointmentId) {
                await tx.appointment.update({
                    where: { id: appointmentId },
                    data: { status: 'Completed' },
                });
            }

            return createdBill;
        });

        res.status(201).json(newBill);

    } catch (error) {
        console.error("Error creating bill:", error);
        res.status(500).json({ message: error.message || 'Server error creating bill.' });
    }
};

module.exports = {
    getAllBills,
    createBill
};
