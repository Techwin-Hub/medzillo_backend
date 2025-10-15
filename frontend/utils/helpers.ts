// utils/helpers.ts

import { Consultation, BillItem, Medicine, Batch } from '../types';

/**
 * Generates a list of billable items from a consultation's prescription.
 * This function intelligently checks against available medicine stock, handles shortfalls,
 * and processes items based on a FIFO (First-In, First-Out) principle using batch expiry dates.
 *
 * @param consultation The consultation object containing the prescription to be billed.
 * @param medicines The complete list of medicines available in the inventory.
 * @returns An array of `BillItem` objects ready to be added to a draft bill.
 */
export const generateBillItemsFromPrescription = (consultation: Consultation, medicines: Medicine[]): BillItem[] => {
    const billItems: BillItem[] = [];

    consultation.prescription.forEach(item => {
        // Case 1: Custom-typed or external medicine (no medicineId). Add with zero rate.
        if (!item.medicineId) {
            billItems.push({
                itemType: 'Medicine',
                itemName: `${item.medicineName} (No Stock)`,
                quantity: item.quantity,
                rate: 0,
                amount: 0,
                gstRate: 0,
                isRemovable: true,
            });
        } else { // Case 2: Medicine from inventory.
            const med = medicines.find(m => m.id === item.medicineId);
            if (!med) {
                // If medicineId exists but is not in inventory (e.g., deleted), treat as out of stock.
                billItems.push({
                    itemType: 'Medicine',
                    itemName: `${item.medicineName} (No Stock)`,
                    quantity: item.quantity,
                    rate: 0,
                    amount: 0,
                    gstRate: 0,
                    isRemovable: true,
                });
                return;
            }

            const prescribedQty = item.quantity;
            const availableQty = med.totalStockInUnits;
            const billableQty = Math.min(prescribedQty, availableQty);
            const shortFallQty = prescribedQty - billableQty;

            // Add the available portion of the medicine to the bill from the oldest batches first.
            if (billableQty > 0) {
                let quantityToBillFromBatches = billableQty;
                // Use FIFO based on expiry for billing.
                const sortedBatches = [...med.batches]
                    .filter(b => (b.packQuantity * b.packSize) + b.looseQuantity > 0)
                    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

                for (const batch of sortedBatches) {
                    if (quantityToBillFromBatches === 0) break;
                    const batchStockInUnits = (batch.packQuantity * batch.packSize) + batch.looseQuantity;
                    const billAmountFromBatch = Math.min(quantityToBillFromBatches, batchStockInUnits);
                    if (billAmountFromBatch > 0) {
                        const unitRate = batch.packSize > 0 ? batch.sellingRate / batch.packSize : batch.sellingRate;
                        billItems.push({
                            itemType: 'Medicine',
                            medicineId: med.id,
                            itemName: item.medicineName,
                            hsnCode: med.hsnCode,
                            quantity: billAmountFromBatch,
                            rate: unitRate,
                            amount: unitRate * billAmountFromBatch,
                            gstRate: med.gstRate,
                            batchNumber: batch.batchNumber,
                            isRemovable: true,
                        });
                        quantityToBillFromBatches -= billAmountFromBatch;
                    }
                }
            }

            // If prescribed quantity > available, add the shortfall as a separate "out of stock" item.
            if (shortFallQty > 0) {
                billItems.push({
                    itemType: 'Medicine',
                    medicineId: null, // No inventory link for the out-of-stock portion
                    itemName: `${item.medicineName} (No Stock)`,
                    quantity: shortFallQty,
                    rate: 0,
                    amount: 0,
                    gstRate: 0,
                    isRemovable: true,
                });
            }
        }
    });

    return billItems;
};