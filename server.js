require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const clinicRoutes = require('./routes/clinicRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const consultationRoutes = require('./routes/consultationRoutes'); // <-- NEW
const supplierRoutes = require('./routes/supplierRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const billingRoutes = require('./routes/billingRoutes');
const reportRoutes = require('./routes/reportsRoutes');
const utilitiesRoutes = require('./routes/utilitiesRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middlewares ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- Routes ---
app.get('/', (req, res) => {
  res.send('Medzillo Backend is running!');
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/clinic', clinicRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/consultations', consultationRoutes); // <-- NEW
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/medicines', medicineRoutes);
app.use('/api/v1/bills', billingRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/utilities', utilitiesRoutes);


// --- Error Handling ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
