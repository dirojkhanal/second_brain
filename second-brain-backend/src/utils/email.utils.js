import { Resend } from 'resend';
import { config } from '../config/env.js';

const resend = new Resend(config.email.resendApiKey);

export const sendOTPEmail = async ({ toEmail, name, otp, type }) => {
    const subject = type === 'forgot_password'
        ? 'Reset Your Password'
        : 'Verify Your Email';

    const message = type === 'forgot_password'
        ? `You requested a password reset. Use the OTP below to continue:`
        : `Welcome! Please verify your email address using the OTP below:`;

    const html = `
<div style="
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    background: linear-gradient(135deg, #f8fafc, #e0e7ff);
    padding: 40px 10px;
    min-height: 100%;
">
  <div style="
      max-width: 440px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 24px;
      padding: 40px 32px;
      box-shadow: 0 20px 70px rgba(15, 23, 42, 0.1),
                  0 4px 25px rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(241, 245, 249, 0.9);
      overflow: hidden;
      position: relative;
  ">
    <!-- Modern top accent bar -->
    <div style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 5px;
        background: linear-gradient(90deg, #1e40af, #3b82f6, #60a5fa);
    "></div>

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h2 style="
          margin: 0 0 8px 0;
          font-size: 26px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.6px;
      ">
        ${subject}
      </h2>
      <p style="color: #64748b; font-size: 15px; margin: 0; font-weight: 500;">
        Secure OTP Verification
      </p>
    </div>

    <!-- Greeting -->
    <p style="
        font-size: 16px;
        color: #334155;
        margin-bottom: 8px;
    ">
      Hi <strong style="color: #0f172a;">${name}</strong>,
    </p>

    <p style="
        font-size: 15px;
        color: #475569;
        line-height: 1.65;
        margin-bottom: 28px;
    ">
      ${message}
    </p>

    <!-- Modern OTP Box - New Stylish Design -->
    <div style="
        margin: 32px 0;
        padding: 28px 20px;
        text-align: center;
        background: linear-gradient(135deg, #1e3a8a, #2563eb);
        border-radius: 18px;
        box-shadow: 0 15px 35px rgba(37, 99, 235, 0.25);
        position: relative;
        overflow: hidden;
    ">
      <!-- Subtle inner glow -->
      <div style="
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 30%, rgba(255,255,255,0.15), transparent);
      "></div>
      
      <div style="
          font-size: 34px;
          font-weight: 700;
          letter-spacing: 14px;
          color: #ffffff;
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
          text-shadow: 0 4px 12px rgba(0,0,0,0.3);
          position: relative;
          z-index: 2;
      ">
        ${otp}
      </div>
    </div>

    <!-- Info -->
    <div style="
        font-size: 13.5px;
        color: #64748b;
        text-align: center;
        line-height: 1.65;
    ">
      <p style="margin: 0 0 6px 0;">
        This code will expire in <strong style="color: #0f172a;">10 minutes</strong>.
      </p>
      <p style="margin: 0;">
        If you didn’t request this, please ignore this email or contact support.
      </p>
    </div>

    <!-- Footer -->
    <div style="
        margin-top: 40px;
        padding-top: 24px;
        border-top: 1px solid #f1f5f9;
        text-align: center;
        font-size: 12.5px;
        color: #94a3b8;
    ">
      © 2026 Second Brain • Secure Authentication System
    </div>
  </div>
</div>
`;

    await resend.emails.send({
        from: config.email.fromEmail,
        to: toEmail,
        subject,
        html,
    });
};