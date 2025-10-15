const prisma = require('../lib/prisma');

const getDaysUntilExpiry = (expiryDateStr) => {
    const expiryDate = new Date(expiryDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// @desc    Get aggregated data for various reports
// @route   GET /api/v1/reports
// @access  Private/PharmacistOrAdmin
const getReportsData = async (req, res) => {
    const { type, startDate, endDate } = req.query;
    const { clinicId } = req.user;

    if (!type || !startDate || !endDate) {
        return res.status(400).json({ message: 'Report type, start date, and end date are required.' });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    try {
        let reportData = {};

        switch (type) {
            case 'inventory':
                const medicines = await prisma.medicine.findMany({
                    where: { clinicId },
                    include: { batches: true },
                });

                const lowStockItems = medicines.filter(m => m.totalStockInUnits > 0 && m.totalStockInUnits < m.minStockLevel);
                const outOfStockItems = medicines.filter(m => m.totalStockInUnits <= 0);

                const nearExpiryItems = [];
                medicines.forEach(med => {
                    med.batches.forEach(batch => {
                        const days = getDaysUntilExpiry(batch.expiryDate);
                        if (days > 0 && days <= 90) {
                            nearExpiryItems.push({ medicineName: med.name, ...batch, daysUntilExpiry: days });
                        }
                    });
                });
                nearExpiryItems.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

                reportData = { lowStockItems, outOfStockItems, nearExpiryItems };
                break;

            case 'sales':
                const bills = await prisma.bill.findMany({
                    where: {
                        clinicId,
                        date: { gte: start, lte: end },
                    },
                    include: { items: true },
                });

                const totalSales = bills.reduce((acc, bill) => acc + bill.totalAmount, 0);
                const totalItemsSold = bills.reduce((acc, bill) => acc + bill.items.reduce((itemAcc, item) => itemAcc + item.quantity, 0), 0);
                
                reportData = {
                    bills,
                    summary: {
                        totalSales,
                        totalBills: bills.length,
                        totalItemsSold,
                    },
                };
                break;
            
            case 'clinic':
                 const appointments = await prisma.appointment.findMany({
                    where: {
                        doctor: { clinicId },
                        startTime: { gte: start, lte: end },
                    },
                });

                const newPatients = await prisma.patient.count({
                    where: {
                        clinicId,
                        consultations: {
                            some: {
                                date: { gte: start, lte: end }
                            }
                        }
                        // This is a simplification. A real implementation might check if the first-ever consultation date falls in the range.
                    }
                });

                const statusCounts = appointments.reduce((acc, apt) => {
                    acc[apt.status] = (acc[apt.status] || 0) + 1;
                    return acc;
                }, {});

                reportData = {
                    totalAppointments: appointments.length,
                    completed: statusCounts['Completed'] || 0,
                    scheduled: statusCounts['Scheduled'] || 0,
                    cancelled: statusCounts['Cancelled'] || 0,
                    noShow: statusCounts['No Show'] || 0,
                    newPatients,
                };
                break;

            default:
                return res.status(400).json({ message: 'Invalid report type specified.' });
        }

        res.status(200).json(reportData);

    } catch (error) {
        console.error(`Error fetching report data for type "${type}":`, error);
        res.status(500).json({ message: 'Server error fetching report data.' });
    }
};

module.exports = {
    getReportsData,
};
