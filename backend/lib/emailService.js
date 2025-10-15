const nodemailer = require('nodemailer');

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Sends an OTP email to the specified recipient.
 * @param {string} to - The recipient's email address.
 * @param {string} otp - The One-Time Password to send.
 * @returns {Promise<void>}
 */
const sendOtpEmail = async (to, otp) => {
    const mailOptions = {
        from: `"Medzillo Clinic" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: 'Your One-Time Password (OTP) for Medzillo',
        html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Medzillo Registration OTP</h2>
                <p>Thank you for registering. Please use the following One-Time Password (OTP) to complete your registration:</p>
                <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${otp}</p>
                <p>This OTP is valid for 5 minutes.</p>
                <p>If you did not request this, please ignore this email.</p>
                <br>
                <p>Best Regards,</p>
                <p>The Medzillo Team</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${to}`);
    } catch (error) {
        console.error(`Error sending OTP email to ${to}:`, error);
        // In a real application, you might have more robust error handling,
        // like queuing the email to be sent again later.
        throw new Error('Failed to send OTP email.');
    }
};

module.exports = { sendOtpEmail };
