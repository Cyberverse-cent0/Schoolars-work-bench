import { logger } from "./logger";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static instance: EmailService;

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<{ resetLink?: string }> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - ScholarForge</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background-color: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            font-size: 24px;
            font-weight: 600;
            color: #3b82f6;
          }
          .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #2563eb;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <div style="width: 32px; height: 32px; background-color: #3b82f6; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                </svg>
              </div>
              ScholarForge
            </div>
          </div>
          
          <h2>Password Reset Request</h2>
          <p>Hello,</p>
          <p>We received a request to reset the password for your ScholarForge account. Click the button below to reset your password:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${resetUrl}</p>
          
          <p><strong>Important:</strong></p>
          <ul>
            <li>This link will expire in 1 hour for security reasons</li>
            <li>If you didn't request this password reset, you can safely ignore this email</li>
            <li>Your password will remain unchanged if you don't click the link</li>
          </ul>
          
          <div class="footer">
            <p>This is an automated message from ScholarForge. Please do not reply to this email.</p>
            <p>If you have questions, contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Password Reset - ScholarForge

Hello,

We received a request to reset the password for your ScholarForge account. 

To reset your password, visit this link:
${resetUrl}

Important:
- This link will expire in 1 hour for security reasons
- If you didn't request this password reset, you can safely ignore this email
- Your password will remain unchanged if you don't use the link

This is an automated message from ScholarForge. Please do not reply to this email.
    `;

    return await this.sendEmail({
      to: email,
      subject: "Reset your ScholarForge password",
      html,
      text
    });
  }

  private async sendEmail(options: EmailOptions): Promise<{ resetLink?: string }> {
    // In development, log the email instead of sending it
    if (process.env.NODE_ENV === 'development' || !process.env.SMTP_HOST) {
      logger.info({
        action: "email_sent_development",
        to: options.to,
        subject: options.subject,
        timestamp: new Date().toISOString()
      }, `Email would be sent to ${options.to}: ${options.subject}`);
      
      console.log('\n=== EMAIL DEBUG ===');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`HTML: ${options.html.substring(0, 200)}...`);
      console.log('==================\n');
      
      // For password reset emails, return the reset link for development testing
      if (options.subject.includes('Password Reset')) {
        const resetUrlMatch = options.html.match(/href="([^"]*reset-password[^"]*)"/);
        if (resetUrlMatch) {
          return { resetLink: resetUrlMatch[1] };
        }
      }
      
      return {};
    }

    // Production email sending (implement with your preferred email service)
    try {
      // Example implementation with nodemailer or similar
      // Uncomment and configure when you have SMTP settings
      
      /*
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@scholarforge.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      */

      logger.info({
        action: "email_sent",
        to: options.to,
        subject: options.subject,
        timestamp: new Date().toISOString()
      }, `Email sent successfully to ${options.to}`);
      
      return {};
      
    } catch (error) {
      logger.error({
        action: "email_send_failed",
        to: options.to,
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      }, `Failed to send email to ${options.to}: ${(error as Error).message}`);
      
      throw new Error('Failed to send password reset email');
    }
  }
}

export const emailService = EmailService.getInstance();
