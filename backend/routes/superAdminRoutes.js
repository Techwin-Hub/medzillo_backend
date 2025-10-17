const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { protect } = require('../middleware/authMiddleware'); // Assuming a generic protect middleware
const { isSuperAdmin } = require('../middleware/superAdminAuth'); // A new middleware for super admin

// Apply super admin protection to all routes in this file
router.use(protect, isSuperAdmin);

// PUT /api/v1/superadmin/clinics/:id/status
router.put('/clinics/:id/status', async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    try {
        const updatedClinic = await prisma.clinic.update({
            where: { id },
            data: { isActive },
        });
        res.json(updatedClinic);
    } catch (error) {
        console.error(`Failed to update clinic status for ${id}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/v1/superadmin/dashboard-stats
router.get('/dashboard-stats', async (req, res) => {
    try {
        const clinics = await prisma.clinic.findMany({
            include: {
                _count: {
                    select: {
                        patients: true,
                    },
                },
                bills: {
                    select: {
                        totalAmount: true,
                    },
                },
            },
        });

        const dashboardData = clinics.map(clinic => {
            const totalSales = clinic.bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
            return {
                id: clinic.id,
                name: clinic.name,
                isActive: clinic.isActive,
                createdAt: clinic.createdAt,
                patientCount: clinic._count.patients,
                totalSales: totalSales,
            };
        });

        res.json(dashboardData);
    } catch (error) {
        console.error('Failed to get dashboard stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;