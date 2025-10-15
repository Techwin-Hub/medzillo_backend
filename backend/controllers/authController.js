const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../lib/emailService');

// In-memory store for OTPs and registration data. In production, use Redis or a database.
const otpStore = {};

// Helper to generate a random 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Health check
exports.healthCheck = (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Auth service is running' });
};

// Step 1 of Registration: Validate data and send OTP
exports.sendRegistrationOtp = async (req, res) => {
    const { clinicName, name, email, password } = req.body;

    if (!clinicName || !name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    if (!validateEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    try {
        const existingUser = await prisma.user.findFirst({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'This email is already registered.' });
        }

        const otp = generateOtp();
        const expires = Date.now() + 5 * 60 * 1000; // 5 minute expiry

        // Send email before storing, so we don't store if the email fails
        await sendOtpEmail(email, otp);

        otpStore[email] = {
            otp,
            expires,
            data: { clinicName, name, email, password },
            context: 'register'
        };

        res.status(200).json({ success: true, message: 'OTP sent to your email.' });

    } catch (error) {
        console.error("Error sending registration OTP:", error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};

// Step 2 of Registration: Verify OTP and create clinic/user
exports.verifyOtpAndRegister = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    const storedOtpData = otpStore[email];

    if (!storedOtpData || storedOtpData.context !== 'register') {
        return res.status(400).json({ message: 'No registration pending for this email. Please start over.' });
    }
    if (storedOtpData.otp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP.' });
    }
    if (Date.now() > storedOtpData.expires) {
        delete otpStore[email];
        return res.status(400).json({ message: 'OTP has expired. Please try again.' });
    }
    
    const { clinicName, name, password } = storedOtpData.data;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newClinic = await prisma.clinic.create({
            data: {
                name: clinicName,
                users: {
                    create: {
                        name,
                        email,
                        password: hashedPassword,
                        role: 'Admin',
                    },
                },
            },
            include: {
                users: true,
            },
        });
        
        const newUser = newClinic.users[0];
        delete otpStore[email];

        const token = jwt.sign(
            { userId: newUser.id, clinicId: newUser.clinicId, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                clinicId: newUser.clinicId,
            },
        });

    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ message: 'Failed to create clinic. Please try again.' });
    }
};

// Login user
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { clinic: true },
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        
        if (!user.clinic.isActive) {
            return res.status(403).json({ message: 'This clinic account is currently inactive. Please contact support.' });
        }

        const token = jwt.sign(
            { userId: user.id, clinicId: user.clinicId, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.status(200).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                clinicId: user.clinicId,
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

// Step 1 of Password Reset: Send OTP
exports.sendPasswordResetOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: 'Email is required.' });
    if (!validateEmail(email)) return res.status(400).json({ message: 'Invalid email format.' });

    try {
        const user = await prisma.user.findFirst({ where: { email, role: 'Admin' } });
        if (!user) {
            return res.status(404).json({ message: 'No primary admin account found with this email.' });
        }

        const otp = generateOtp();
        const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

        await sendOtpEmail(email, otp);

        otpStore[email] = { otp, expires, context: 'reset' };

        res.status(200).json({ success: true, message: 'Password reset OTP sent.' });

    } catch (error) {
        console.error("Error sending password reset OTP:", error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// Step 2 of Password Reset: Verify OTP
exports.verifyPasswordResetOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    const storedOtpData = otpStore[email];
    if (!storedOtpData || storedOtpData.context !== 'reset' || storedOtpData.otp !== otp || Date.now() > storedOtpData.expires) {
        return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }
    
    storedOtpData.verified = true;

    res.status(200).json({ success: true, message: 'OTP verified. You can now reset your password.' });
};

// Step 3 of Password Reset: Set new password
exports.resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).json({ message: 'Email and new password are required.' });
    }

    const storedOtpData = otpStore[email];
    if (!storedOtpData || !storedOtpData.verified || storedOtpData.context !== 'reset') {
        return res.status(403).json({ message: 'OTP not verified. Please verify the OTP first.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword },
        });

        delete otpStore[email];

        res.status(200).json({ success: true, message: 'Password has been reset successfully.' });

    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: 'Server error.' });
    }
};
