// routes/consultationRoutes.js
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma'); // Using your existing prisma client file

// POST /api/v1/consultations - Create a new consultation
router.post('/', async (req, res) => {
  const {
    patientId,
    doctorId,
    appointmentId,
    chiefComplaint,
    diagnosis,
    notes,
    nextReviewDate,
    temperature,
    bloodPressure,
    pulse,
    weight,
    height,
    oxygenSaturation,
    prescription,
  } = req.body;

  if (!patientId || !doctorId || !appointmentId || !chiefComplaint || !diagnosis) {
    return res.status(400).json({ error: 'Missing required consultation fields.' });
  }

  try {
    const [newConsultation] = await prisma.$transaction([
      prisma.consultation.create({
        data: {
          patient: { connect: { id: patientId } },
          doctor: { connect: { id: doctorId } },
          appointment: { connect: { id: appointmentId } },
          chiefComplaint,
          diagnosis,
          notes,
          nextReviewDate,
          temperature: temperature ? parseFloat(temperature) : null,
          bloodPressure,
          pulse: pulse ? parseInt(pulse, 10) : null,
          weight: weight ? parseFloat(weight) : null,
          height: height ? parseFloat(height) : null,
          oxygenSaturation: oxygenSaturation ? parseFloat(oxygenSaturation) : null,
          prescription: prescription && prescription.length > 0 ? {
            createMany: {
              data: prescription.map(item => ({
                medicineName: item.medicineName,
                quantity: parseInt(item.quantity, 10),
                dosage: item.dosage,
                duration: item.duration,
                notes: item.notes,
              })),
            },
          } : undefined,
        },
        include: {
          prescription: true,
        },
      }),
      prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'Ready for Billing' },
      }),
    ]);

    res.status(201).json(newConsultation);
  } catch (error) {
    console.error('Failed to create consultation:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('appointmentId')) {
        return res.status(409).json({ error: 'A consultation for this appointment already exists.' });
    }
    res.status(500).json({ error: 'Internal server error while creating consultation.' });
  }
});


// --- NEW ENDPOINT STARTS HERE ---

// POST /api/v1/consultations/:consultationId/schedule - Schedule an appointment from a review
router.post('/:consultationId/schedule', async (req, res) => {
  const { consultationId } = req.params;
  const { patientId, doctorId, startTime } = req.body;

  // Basic validation to ensure critical data is present
  if (!patientId || !doctorId || !startTime) {
    return res.status(400).json({ error: 'Missing required fields for scheduling an appointment (patientId, doctorId, startTime).' });
  }

  try {
    // First, we get the patient and doctor details to ensure they exist
    // and to retrieve their names for the new appointment record.
    const [patient, doctor] = await Promise.all([
        prisma.patient.findUnique({ where: { id: patientId } }),
        prisma.user.findUnique({ where: { id: doctorId } })
    ]);

    if (!patient) {
        return res.status(404).json({ error: `Patient with ID ${patientId} not found.` });
    }
    if (!doctor) {
        return res.status(404).json({ error: `Doctor with ID ${doctorId} not found.` });
    }

    // Now, we use a transaction to perform two database actions at once:
    // 1. Create the new appointment for the review.
    // 2. Clear the 'nextReviewDate' from the original consultation so it's no longer "due".
    const [newAppointment] = await prisma.$transaction([
      prisma.appointment.create({
        data: {
          patientId: patient.id,
          patientName: patient.name, // Populated from our check above
          doctorId: doctor.id,
          doctorName: doctor.name,   // Populated from our check above
          startTime: new Date(startTime),
          status: 'Scheduled',
        }
      }),
      prisma.consultation.update({
        where: { id: consultationId },
        data: { nextReviewDate: null } // This clears the review date
      })
    ]);

    // Send the newly created appointment back to the app with a 201 "Created" status
    res.status(201).json(newAppointment);
  } catch (error) {
    console.error('Failed to schedule from review:', error);
    // This Prisma error code means the record to update (the consultation) was not found.
    if (error.code === 'P2025') {
        return res.status(404).json({ error: 'The consultation you are trying to schedule from could not be found.' });
    }
    // Handle all other errors
    res.status(500).json({ error: 'Internal server error while scheduling from review.' });
  }
});

// --- NEW ENDPOINT ENDS HERE ---

module.exports = router;
