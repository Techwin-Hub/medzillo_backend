// controllers/appointmentController.js
const prisma = require('../lib/prisma');

// @desc    Get all appointments for a clinic
// @route   GET /api/v1/appointments
// @access  Private
const getAllAppointments = async (req, res) => {
    try {
        const appointments = await prisma.appointment.findMany({
            where: {
                doctor: {
                    clinicId: req.user.clinicId,
                }
            },
            orderBy: {
                startTime: 'asc'
            }
        });
        res.status(200).json(appointments);
    } catch (error) {
        console.error("Error fetching appointments:", error);
        res.status(500).json({ message: 'Server error fetching appointments.' });
    }
};

// @desc    Create a new appointment
// @route   POST /api/v1/appointments
// @access  Private
const createAppointment = async (req, res) => {
    const { patientId, patientName, doctorId, doctorName, startTime } = req.body;

    if (!patientId || !doctorId || !startTime) {
        return res.status(400).json({ message: 'Patient, doctor, and start time are required.' });
    }

    try {
        const newAppointment = await prisma.appointment.create({
            data: {
                patientId,
                patientName,
                doctorId,
                doctorName,
                startTime: new Date(startTime),
                status: 'Scheduled',
            },
        });
        res.status(201).json(newAppointment);
    } catch (error) {
        console.error("Error creating appointment:", error);
        res.status(500).json({ message: 'Server error creating appointment.' });
    }
};

// @desc    Update an appointment's status
// @route   PUT /api/v1/appointments/:appointmentId/status
// @access  Private
const updateAppointmentStatus = async (req, res) => {
    const { appointmentId } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: 'Status is required.' });
    }

    try {
        const appointment = await prisma.appointment.findFirst({
            where: {
                id: appointmentId,
                doctor: { clinicId: req.user.clinicId }
            }
        });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        const updatedAppointment = await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status },
        });

        res.status(200).json(updatedAppointment);
    } catch (error) {
        console.error("Error updating appointment status:", error);
        res.status(500).json({ message: 'Server error updating status.' });
    }
};

// @desc    Delete an appointment
// @route   DELETE /api/v1/appointments/:appointmentId
// @access  Private
const deleteAppointment = async (req, res) => {
    const { appointmentId } = req.params;

    try {
        const appointment = await prisma.appointment.findFirst({
            where: {
                id: appointmentId,
                doctor: { clinicId: req.user.clinicId }
            }
        });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        await prisma.appointment.delete({
            where: { id: appointmentId },
        });

        res.status(200).json({ message: 'Appointment deleted successfully.' });
    } catch (error) {
        console.error("Error deleting appointment:", error);
        res.status(500).json({ message: 'Server error deleting appointment.' });
    }
};

// @desc    Add or update vitals for an appointment
// @route   POST /api/v1/appointments/:appointmentId/vitals
// @access  Private
const addVitalsToAppointment = async (req, res) => {
    const { appointmentId } = req.params;
    // FIX 1: The vitals data is nested inside a 'vitals' object in the body.
    const { vitals } = req.body; 

    if (!vitals || Object.keys(vitals).length === 0) {
        return res.status(400).json({ message: 'Vitals data is missing in the request body.' });
    }

    try {
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
        });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }
        
        const vitalsConsultationId = `con_vitals_${appointmentId}`;

        // FIX 2: Parse string numbers from the form into actual numbers for the database
        const parsedVitals = {
            temperature: vitals.temperature ? parseFloat(vitals.temperature) : null,
            bloodPressure: vitals.bloodPressure || null,
            pulse: vitals.pulse ? parseInt(vitals.pulse, 10) : null,
            weight: vitals.weight ? parseFloat(vitals.weight) : null,
            height: vitals.height ? parseFloat(vitals.height) : null,
            oxygenSaturation: vitals.oxygenSaturation ? parseInt(vitals.oxygenSaturation, 10) : null,
        };

        const vitalsConsultation = await prisma.consultation.upsert({
            where: { id: vitalsConsultationId },
            update: {
                ...parsedVitals,
            },
            create: {
                id: vitalsConsultationId,
                patientId: appointment.patientId,
                doctorId: appointment.doctorId,
                chiefComplaint: 'Vitals Recorded',
                diagnosis: 'Vitals Recorded',
                ...parsedVitals,
                appointmentId: appointment.id, // Link it back to the appointment
                prescription: { create: [] }
            },
            include: {
                prescription: true
            }
        });

        res.status(201).json(vitalsConsultation);
    } catch (error) {
        console.error(`Failed to add vitals for appointment ${appointmentId}:`, error);
        res.status(500).json({ message: 'Internal server error while saving vitals.' });
    }
};


module.exports = {
    getAllAppointments,
    createAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    addVitalsToAppointment,
};
