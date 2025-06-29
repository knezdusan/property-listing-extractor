import nodemailer from "nodemailer";
import { EmailData, EmailSendResult } from "@/types";

/**
 * Sends an email using the provided email data
 * @param {EmailData} emailData - The email data to send
 * @returns {Promise<EmailSendResult>} - The result of the email sending operation
 */
export async function sendEmail({ to, subject, text, html }: EmailData): Promise<EmailSendResult> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    return {
      success: false,
      message: "Missing SMTP environment variable(s). Please check your .env configuration.",
    };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: true, // Use true for port 465 (SSL)
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"Booking Ready" <${SMTP_FROM}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);
    return {
      success: true,
      message: `${info.messageId} - Email sent successfully`,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      message: `${error} - Failed to send email`,
    };
  }
}
