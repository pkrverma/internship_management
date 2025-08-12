const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, // e.g., "smtp.gmail.com"
    port: Number(process.env.SMTP_PORT), // e.g., 587
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false otherwise
    auth: {
      user: process.env.SMTP_EMAIL, // your SMTP username
      pass: process.env.SMTP_PASSWORD, // your SMTP password or app password
    },
  });

  const mailOptions = {
    from: `"Internship Portal" <${process.env.SMTP_EMAIL}>`,
    to: options.email, // recipient
    subject: options.subject,
    text: options.message,
    html: options.html || options.message,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
