import nodemailer from "nodemailer";
import { env } from "../../config/env.js";

interface SendPasswordResetEmailInput {
  email: string;
  resetUrl: string;
  otpCode: string;
  expiresAt: Date;
}

function buildPasswordResetEmail(input: SendPasswordResetEmailInput) {
  const expiresAt = input.expiresAt.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return {
    subject: "Reset your Splitly password",
    text: [
      "We received a request to reset your Splitly password.",
      "",
      `Your OTP code is: ${input.otpCode}`,
      `Reset link: ${input.resetUrl}`,
      `This reset request expires at ${expiresAt}.`,
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2 style="margin: 0 0 12px;">Reset your Splitly password</h2>
        <p>We received a request to reset your Splitly password.</p>
        <p>Your OTP code is:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 12px 0;">${input.otpCode}</p>
        <p>
          <a href="${input.resetUrl}" style="color: #16A34A; font-weight: 700;">Reset password</a>
        </p>
        <p style="color: #6B7280;">This reset request expires at ${expiresAt}.</p>
        <p style="color: #6B7280;">If you did not request this, you can ignore this email.</p>
      </div>
    `,
  };
}

function logPasswordResetEmail(input: SendPasswordResetEmailInput) {
  console.info(
    [
      `Password reset email for ${input.email}`,
      `OTP: ${input.otpCode}`,
      `Reset URL: ${input.resetUrl}`,
      `Expires at: ${input.expiresAt.toISOString()}`,
    ].join("\n"),
  );
}

function getEmailFrom() {
  if (env.emailFrom) {
    return env.emailFrom;
  }

  if (env.emailProvider === "gmail" && env.gmailSmtpUser) {
    return `Splitly <${env.gmailSmtpUser}>`;
  }

  return "Splitly <no-reply@splitly.local>";
}

async function sendWithGmail(
  input: SendPasswordResetEmailInput,
  email: ReturnType<typeof buildPasswordResetEmail>,
) {
  if (!env.gmailSmtpUser || !env.gmailAppPassword) {
    throw new Error(
      "Gmail SMTP is not configured. Set GMAIL_SMTP_USER and GMAIL_APP_PASSWORD in be/.env.",
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.gmailSmtpUser,
      pass: env.gmailAppPassword,
    },
  });

  await transporter.sendMail({
    from: getEmailFrom(),
    to: input.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}

async function sendWithResend(
  input: SendPasswordResetEmailInput,
  email: ReturnType<typeof buildPasswordResetEmail>,
) {
  if (!env.resendApiKey) {
    throw new Error("Resend is not configured. Set RESEND_API_KEY in be/.env.");
  }

  const response = await fetch(env.resendApiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getEmailFrom(),
      to: input.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");
    throw new Error(responseText || "Unable to send password reset email.");
  }
}

export async function sendPasswordResetEmail(
  input: SendPasswordResetEmailInput,
) {
  const email = buildPasswordResetEmail(input);

  if (env.emailProvider === "gmail") {
    await sendWithGmail(input, email);
    return;
  }

  if (env.emailProvider === "resend") {
    await sendWithResend(input, email);
    return;
  }

  logPasswordResetEmail(input);
}
