// controllers/patientController.js (Corrected Version)

const prisma = require('../lib/prisma');

// @desc    Get all patients for a clinic
// @route   GET /api/v1/patients
// @access  Private
const getAllPatients = async (req, res) => {
    try {
        const patients = await prisma.patient.findMany({
            where: { clinicId: req.user.clinicId },
            include: {
                consultations: {
                    include: {
                        prescription: true 
                    },
                    orderBy: {
                        date: 'desc'
                    }
                },
                vaccinations: true
            },
            orderBy: { name: 'asc' },
        });
        res.status(200).json(patients);
    } catch (error) {
        console.error("Error fetching all patients:", error);
        res.status(500).json({ message: 'Server error fetching patients.' });
    }
};

// @desc    Get a single patient by ID
// @route   GET /api/v1/patients/:patientId
// @access  Private
const getPatientById = async (req, res) => {
    try {
        const patient = await prisma.patient.findFirst({
            where: {
                id: req.params.patientId,
                clinicId: req.user.clinicId,
            },
            include: { 
                consultations: {
                    include: {
                        prescription: true
                    },
                    orderBy: {
                        date: 'desc'
                    }
                }, 
                vaccinations: true 
            },
        });
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found.' });
        }
        res.status(200).json(patient);
    } catch (error) {
        console.error("Error fetching patient by ID:", error);
        res.status(500).json({ message: 'Server error fetching patient.' });
    }
};

// @desc    Create a new patient
// @route   POST /api/v1/patients
// @access  Private
const createPatient = async (req, res) => {
    const { name, mobile, dob, gender, address, bloodGroup, allergies, vaccinations, skippedVaccinations } = req.body;
    if (!name || !mobile) {
        return res.status(400).json({ message: 'Name and mobile are required.' });
    }
    try {
        const newPatient = await prisma.patient.create({
            data: {
                name, mobile, dob, gender, address, bloodGroup, allergies,
                vaccinations: { create: vaccinations || [] },
                skippedVaccinations: skippedVaccinations || [],
                clinicId: req.user.clinicId,
            },
        });
        res.status(201).json(newPatient);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'A patient with this name and mobile number already exists.' });
        }
        console.error("Error creating patient:", error);
        res.status(500).json({ message: 'Server error creating patient.' });
    }
};

// @desc    Bulk import patients
// @route   POST /api/v1/patients/import
// @access  Private/Admin
const bulkImportPatients = async (req, res) => {
    const patientsData = req.body; // Expect an array of patient objects
    if (!Array.isArray(patientsData) || patientsData.length === 0) {
        return res.status(400).json({ message: 'Patient data must be a non-empty array.' });
    }
    const dataToCreate = patientsData.map(p => ({ ...p, clinicId: req.user.clinicId }));
    try {
        const result = await prisma.patient.createMany({
            data: dataToCreate,
            skipDuplicates: true,
        });
        res.status(201).json({ message: `${result.count} patients imported successfully.` });
    } catch (error) {
        res.status(500).json({ message: 'Server error during bulk import.' });
    }
};

// @desc    Update a patient
// @route   PUT /api/v1/patients/:patientId
// @access  Private
const updatePatient = async (req, res) => {
    // THIS IS THE FIX: Explicitly destructure only the fields we want to update.
    // This prevents relational fields like 'consultations' from causing an error.
    const { 
        name, mobile, dob, gender, address, bloodGroup, allergies, 
        vaccinations, skippedVaccinations, vaccinationOverrides 
    } = req.body;

    try {
        const patient = await prisma.patient.findFirst({
            where: { id: req.params.patientId, clinicId: req.user.clinicId },
        });
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found.' });
        }
        
        // Construct a safe data object for the update.
        const updateData = {
            name, mobile, dob, gender, address, bloodGroup, allergies,
            skippedVaccinations,
            vaccinationOverrides,
            // Handle the nested write for vaccinations separately.
            ...(vaccinations && {
                vaccinations: {
                    deleteMany: {}, // Clear existing records
                    create: vaccinations, // Create new ones from the request body
                },
            }),
        };

        const updatedPatient = await prisma.patient.update({
            where: { id: req.params.patientId },
            data: updateData,
            include: {
                consultations: { include: { prescription: true }, orderBy: { date: 'desc' } },
                vaccinations: true
            }
        });
        res.status(200).json(updatedPatient);
    } catch (error) {
        console.error("Error updating patient:", error);
        res.status(500).json({ message: 'Server error updating patient.' });
    }
};

// @desc    Delete a patient
// @route   DELETE /api/v1/patients/:patientId
// @access  Private/Admin
const deletePatient = async (req, res) => {
    try {
        const patient = await prisma.patient.findFirst({
            where: { id: req.params.patientId, clinicId: req.user.clinicId },
        });
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found.' });
        }
        await prisma.patient.delete({
            where: { id: req.params.patientId },
        });
        res.status(200).json({ message: 'Patient deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting patient.' });
    }
};

module.exports = {
    getAllPatients,
    getPatientById,
    createPatient,
    bulkImportPatients,
    updatePatient,
    deletePatient,
};
