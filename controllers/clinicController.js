const prisma = require('../lib/prisma');

// @desc    Get clinic profile
// @route   GET /api/v1/clinic/profile
// @access  Private
const getClinicProfile = async (req, res) => {
    try {
        let profile = await prisma.pharmacyInfo.findUnique({
            where: { clinicId: req.user.clinicId },
        });

        if (!profile) {
            // If no profile exists, create a default one based on clinic info
            const clinic = await prisma.clinic.findUnique({ where: { id: req.user.clinicId }});
            profile = await prisma.pharmacyInfo.create({
                data: {
                    clinicId: req.user.clinicId,
                    name: clinic?.name || 'My Clinic',
                    organizationType: 'Clinic',
                    address: '', city: '', pincode: '', phone: '',
                    gstin: '', drugLicense: '', isGstEnabled: true
                }
            });
        }
        res.status(200).json(profile);
    } catch (error) {
        console.error("Error fetching clinic profile:", error);
        res.status(500).json({ message: 'Server error fetching profile.' });
    }
};

// @desc    Update clinic profile
// @route   PUT /api/v1/clinic/profile
// @access  Private/Admin
const updateClinicProfile = async (req, res) => {
    const { clinicId, ...dataToUpdate } = req.body; // Exclude clinicId from body
    try {
        const updatedProfile = await prisma.pharmacyInfo.upsert({
            where: { clinicId: req.user.clinicId },
            update: dataToUpdate,
            create: {
                clinicId: req.user.clinicId,
                ...dataToUpdate,
            },
        });
        res.status(200).json(updatedProfile);
    } catch (error) {
        console.error("Error updating clinic profile:", error);
        res.status(500).json({ message: 'Server error updating profile.' });
    }
};

module.exports = {
    getClinicProfile,
    updateClinicProfile,
};
