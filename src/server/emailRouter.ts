import { Router } from 'express';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const emailRouter = Router();

// SMTP Transporter Config (Xneelo Mail Server: mail.bizzbean.com:465)
const getSmtpConfig = () => {
  let host = (process.env.SMTP_HOST || 'smtp.bizzbean.com').trim().replace(/\s+/g, '');
  let port = parseInt((process.env.SMTP_PORT || '465').toString().trim(), 10);
  // Auto-correct: 993 is IMAP (incoming). Outgoing SMTP must be 465 (SSL) or 587 (TLS)
  if (port === 993 || isNaN(port)) {
    port = 465;
  }
  const secure = process.env.SMTP_SECURE !== 'false' && process.env.SMTP_SECURE !== '0';
  let user = (process.env.SMTP_USER || 'thebizzbeanchannel@bizzbean.com').trim().replace(/\s+/g, '');
  let pass = (process.env.SMTP_PASS || 'MailChannel!0750').trim();
  let fromEmail = (process.env.SMTP_FROM || 'thebizzbeanchannel@bizzbean.com').trim().replace(/\s+/g, '');
  // Auto-correct: If user entered port or host in fromEmail (no @)
  if (!fromEmail || !fromEmail.includes('@')) {
    fromEmail = 'thebizzbeanchannel@bizzbean.com';
  }
  let fromName = (process.env.SMTP_FROM_NAME || 'bizzbean').trim();
  // Auto-correct: If user entered host in fromName (e.g. smtp.bizzbean.com)
  if (fromName.includes('.com') || fromName.includes('smtp.')) {
    fromName = 'bizzbean';
  }

  return {
    host,
    port,
    secure,
    user,
    pass,
    fromEmail,
    fromName,
  };
};

const createTransporter = () => {
  const config = getSmtpConfig();
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: false, // Prevents failure if SSL certificate domain is mail.bizzbean.com or xneelo.co.za
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });
};

const FAVICON_CID = 'bizzbean-favicon@bizzbean.com';

/**
 * Resolves the local filesystem path to bizzbean-favicon.jpg (works in both dev & production builds)
 */
const resolveFaviconAssetPath = (): string | null => {
  const candidates = [
    path.resolve(process.cwd(), 'public', 'bizzbean-favicon.jpg'),
    path.resolve(process.cwd(), 'dist', 'bizzbean-favicon.jpg'),
    path.resolve(process.cwd(), 'public', 'favicon.jpg'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
};

interface WelcomeEmailTemplateParams {
  displayName: string;
  recipientEmail: string;
  loginLink: string;
  bookDownloadLink: string;
  logoSrc: string;
  fromEmail: string;
  isSimulationTest?: boolean;
}

const escapeHtml = (value: string): string =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Shared HTML builder for the official "your SANDBOX is ready" onboarding letter.
 * Uses bizzbean-favicon.jpg (attached via CID for SMTP or served from /bizzbean-favicon.jpg for browser preview).
 */
const buildWelcomeEmailHtml = ({
  displayName,
  recipientEmail,
  loginLink,
  bookDownloadLink,
  logoSrc,
  fromEmail,
  isSimulationTest,
}: WelcomeEmailTemplateParams): string => {
  const safeName = escapeHtml(displayName);
  const safeEmail = escapeHtml(recipientEmail);
  const safeFrom = escapeHtml(fromEmail);
  const testBanner = isSimulationTest
    ? `
          <tr>
            <td align="center" style="background-color: #FEF3C7; border-bottom: 1px solid #F59E0B; padding: 8px 20px; font-family: monospace; font-size: 11px; color: #92400E;">
              SIMULATION TEST DISPATCH &middot; Official &ldquo;your SANDBOX is ready&rdquo; Welcome Letter Preview
            </td>
          </tr>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>your SANDBOX is ready</title>
  <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@100;300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #EBF1F6; font-family: 'Raleway', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #3E74A6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #EBF1F6; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container (Letter 2 Layout) -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 640px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 12px 32px rgba(0,0,0,0.08); border: 1px solid #D8CEBC;">
          
          <!-- Top Slate-Blue Banner (Letter 2) -->
          <tr>
            <td style="background-color: #5584B4; height: 26px; line-height: 26px; font-size: 1px;">&nbsp;</td>
          </tr>${testBanner}

          <!-- Header with Centered Logo (bizzbean-favicon.jpg) & Title -->
          <tr>
            <td align="center" style="padding: 34px 30px 8px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                <tr>
                  <td valign="middle" style="padding-right: 10px;">
                    <img
                      src="${logoSrc}"
                      alt="bizzbean"
                      width="44"
                      height="44"
                      style="display: block; width: 44px; height: 44px; object-fit: contain; border: 0; outline: none; text-decoration: none;"
                    />
                  </td>
                  <td valign="middle">
                    <span style="font-size: 38px; font-weight: 300; letter-spacing: -0.5px; color: #707070; font-family: 'Raleway', -apple-system, sans-serif;">bizz</span><span style="font-size: 38px; font-weight: 100; letter-spacing: -0.5px; color: #707070; font-family: 'Raleway', -apple-system, sans-serif;">bean</span><sup style="font-size: 12px; font-weight: 400; color: #707070; vertical-align: super; margin-left: 2px; font-family: 'Raleway', sans-serif;">TM</sup>
                  </td>
                </tr>
              </table>

              <!-- Main Title: your SANDBOX is ready -->
              <h2 style="margin: 16px 0 0 0; font-size: 27px; font-weight: 300; color: #3E74A6; font-family: 'Raleway', -apple-system, sans-serif; letter-spacing: 0.8px;">
                your SANDBOX is ready
              </h2>
            </td>
          </tr>

          <!-- Salutation & Body Paragraphs (Letter 2) -->
          <tr>
            <td style="padding: 16px 42px 28px 42px; font-size: 14px; line-height: 1.7; color: #3E74A6; font-family: 'Raleway', -apple-system, sans-serif;">
              
              <!-- Salutation -->
              <p style="margin: 0 0 18px 0; font-size: 16px; color: #3E74A6; font-weight: 400; font-family: 'Raleway', sans-serif;">
                Hi, ${safeName}
              </p>

              <p style="margin: 0 0 16px 0; color: #3E74A6; font-size: 13.5px; font-weight: 400; font-family: 'Raleway', sans-serif;">
                Thank you for creating a SANDBOX account with us at bizzbean. We hope that by doing this we can help you discover, build, grow and even enable investment in your entrepreneurial ABILITY.
              </p>

              <p style="margin: 0 0 16px 0; color: #3E74A6; font-size: 13.5px; font-weight: 400; font-family: 'Raleway', sans-serif;">
                Please download your free copy of our book &lsquo;getting to value&rsquo;. Also, keep an eye out for any message notifications. If you have an idea for a business model-set or an education programme, please use TALK TO US - we promise to consider all submissions.
              </p>

              <p style="margin: 0 0 16px 0; color: #3E74A6; font-size: 13.5px; font-weight: 400; font-family: 'Raleway', sans-serif;">
                You can update your business profile in the &lsquo;about&rsquo;, located in the top left of the landing page. When updated, you can use it to market your business.
              </p>

              <p style="margin: 0 0 20px 0; color: #3E74A6; font-size: 13.5px; font-weight: 400; font-family: 'Raleway', sans-serif;">
                We wish you all the best with your entrepreneurial journey.
              </p>

              <!-- Letter Sign-off (Letter 2) -->
              <div style="margin-top: 18px; margin-bottom: 26px;">
                <p style="margin: 0; font-style: italic; color: #4A7DAA; font-family: Georgia, serif; font-size: 14px;">sincerely,</p>
                <p style="margin: 3px 0 0 0; font-weight: 700; font-size: 16px; color: #20476E; font-family: 'Raleway', sans-serif;">the bizzbean team</p>
              </div>

              <!-- Action Row: Book Download + Proceed to Workstation (Letter 2 Buttons) -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="padding-top: 20px; border-top: 1px solid #EAE3D4;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td align="left" style="padding-right: 8px;">
                          <a href="${bookDownloadLink}" target="_blank" style="display: inline-block; background-color: #5584B4; color: #FFFFFF; font-family: 'Raleway', sans-serif; font-size: 13px; font-weight: 500; text-decoration: none; padding: 12px 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(85,132,180,0.3); text-transform: lowercase;">
                            &#8681;&nbsp;download &lsquo;getting to value&rsquo;
                          </a>
                        </td>
                        <td align="right" style="padding-left: 8px;">
                          <a href="${loginLink}" target="_blank" style="display: inline-block; background-color: #12172A; color: #FFFFFF; font-family: 'Raleway', sans-serif; font-size: 13px; font-weight: 500; text-decoration: none; padding: 12px 22px; border-radius: 12px; box-shadow: 0 4px 12px rgba(18,23,42,0.35); text-transform: lowercase;">
                            <span>enter personal sandbox</span>
                            <span style="color: #9FC754; font-weight: bold; margin-left: 6px;">&rarr;</span>
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Green Bottom Banner (Letter 2) -->
          <tr>
            <td align="center" style="background-color: #9FC754; padding: 14px 20px;">
              <span style="font-size: 13px; font-weight: 400; color: #FFFFFF; letter-spacing: 0.5px; font-family: 'Raleway', -apple-system, sans-serif; text-transform: lowercase;">
                instant viability. infinite wisdom. always on.
              </span>
            </td>
          </tr>

        </table>

        <!-- Security / Anti-Impersonation Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 640px; margin-top: 14px;">
          <tr>
            <td align="center" style="font-size: 11px; color: #64748B; line-height: 1.6; font-family: monospace;">
              This onboarding email was dispatched to <strong>${safeEmail}</strong> for security verification.<br>
              If you did not register this sandbox, please report it to <a href="mailto:${safeFrom}" style="color: #5584B4;">${safeFrom}</a>.<br>
              &copy; ${new Date().getFullYear()} bizzbean&trade;. All rights reserved.
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * GET /api/email/status
 * Returns SMTP server status and configured sender
 */
emailRouter.get('/status', async (_req, res) => {
  try {
    const config = getSmtpConfig();
    const faviconPath = resolveFaviconAssetPath();
    res.json({
      configured: Boolean(config.host && config.user),
      host: config.host,
      port: config.port,
      secure: config.secure,
      sender: `"${config.fromName}" <${config.fromEmail}>`,
      accountUser: config.user,
      logoAssetReady: Boolean(faviconPath),
      logoFilename: 'bizzbean-favicon.jpg',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get email status.' });
  }
});

/**
 * POST /api/email/preview-welcome
 * Returns the exact rendered HTML of the "your SANDBOX is ready" email using /bizzbean-favicon.jpg
 * for safe browser preview inside the Onboarding Audit & Simulation Test Lab.
 */
emailRouter.post('/preview-welcome', async (req, res) => {
  try {
    const {
      recipientEmail = 'founder@example.com',
      recipientName = 'Founder',
      firstName,
      appUrl,
      isSimulationTest = false,
    } = req.body || {};

    const config = getSmtpConfig();
    const displayName =
      firstName?.trim() ||
      recipientName?.trim()?.split(' ')[0] ||
      String(recipientEmail).split('@')[0] ||
      'Entrepreneur';

    const reqHost = req.headers['x-forwarded-host'] || req.headers.host;
    const reqProto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    const dynamicOrigin = reqHost ? `${reqProto}://${reqHost}` : null;
    const liveAppUrl = appUrl || process.env.APP_URL || dynamicOrigin || 'https://www.bizzbean.com';

    const loginLink = `${liveAppUrl}?verified=true&email=${encodeURIComponent(recipientEmail)}`;
    const bookDownloadLink = `${liveAppUrl}?action=download-book`;

    const html = buildWelcomeEmailHtml({
      displayName,
      recipientEmail,
      loginLink,
      bookDownloadLink,
      logoSrc: '/bizzbean-favicon.jpg',
      fromEmail: config.fromEmail,
      isSimulationTest: Boolean(isSimulationTest),
    });

    res.json({
      success: true,
      subject: isSimulationTest
        ? '[TEST PREVIEW] your SANDBOX is ready — welcome to bizzbean'
        : 'your SANDBOX is ready — welcome to bizzbean',
      sender: `"${config.fromName}" <${config.fromEmail}>`,
      logoAsset: '/bizzbean-favicon.jpg',
      logoFoundOnDisk: Boolean(resolveFaviconAssetPath()),
      html,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to render welcome email preview.',
    });
  }
});

/**
 * POST /api/email/test
 * Quick endpoint to test SMTP connectivity
 */
emailRouter.post('/test', async (req, res) => {
  try {
    const { targetEmail } = req.body;
    const recipient = targetEmail || 'thebizzbeanchannel@gmail.com';
    const config = getSmtpConfig();
    const transporter = createTransporter();

    // Verify SMTP connection first
    await transporter.verify();

    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: recipient,
      subject: 'bizzbean SMTP Connection Verification',
      text: `This is a test notification confirming that the bizzbean SMTP mail channel (host: ${config.host}:${config.port}) is active and authorized.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1E293B;">
          <h2 style="color: #3A5D7C;">bizzbean SMTP Test Succeeded</h2>
          <p>SMTP server connection via <strong>${config.host}:${config.port}</strong> is operating normally.</p>
          <p style="font-size: 12px; color: #64748B;">Sender: ${config.fromEmail}</p>
        </div>
      `,
    });

    res.json({
      success: true,
      messageId: info.messageId,
      recipient,
      host: config.host,
    });
  } catch (err: any) {
    console.error('[SMTP Test Error]:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'SMTP test failed.',
      code: err.code,
    });
  }
});

/**
 * POST /api/email/send-welcome
 * Dispatches the official "your SANDBOX is ready" welcome email ONLY for brand-new client sign-ups
 * (or explicit admin simulation tests). Never dispatches for existing-client sign-ins.
 */
emailRouter.post('/send-welcome', async (req, res) => {
  try {
    const {
      recipientEmail,
      recipientName,
      firstName,
      appUrl,
      isNewClientSignup,
      isSimulationTest = false,
    } = req.body || {};

    if (!recipientEmail || typeof recipientEmail !== 'string') {
      return res.status(400).json({ error: 'recipientEmail is required.' });
    }

    // Server-side safeguard: never dispatch welcome email unless this is a verified new-client signup or explicit admin test
    if (isNewClientSignup === false && !isSimulationTest) {
      console.info(
        `[Email Service] Suppressed welcome email for ${recipientEmail} (existing client sign-in).`
      );
      return res.json({
        success: true,
        suppressed: true,
        reason: 'Welcome email is only dispatched for brand-new client registrations.',
        recipient: recipientEmail,
      });
    }

    const config = getSmtpConfig();
    const transporter = createTransporter();

    const displayName =
      firstName?.trim() ||
      recipientName?.trim()?.split(' ')[0] ||
      recipientEmail.split('@')[0] ||
      'Entrepreneur';

    const reqHost = req.headers['x-forwarded-host'] || req.headers.host;
    const reqProto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    const dynamicOrigin = reqHost ? `${reqProto}://${reqHost}` : null;
    const liveAppUrl = appUrl || process.env.APP_URL || dynamicOrigin || 'https://www.bizzbean.com';

    const loginLink = `${liveAppUrl}?verified=true&email=${encodeURIComponent(recipientEmail)}`;
    const bookDownloadLink = `${liveAppUrl}?action=download-book`;

    // Inline CID attachment for bizzbean-favicon.jpg so Gmail/Outlook/Apple Mail render the exact brand logo reliably
    const faviconPath = resolveFaviconAssetPath();
    const logoSrc = faviconPath
      ? `cid:${FAVICON_CID}`
      : `${liveAppUrl.replace(/\/$/, '')}/bizzbean-favicon.jpg`;

    const attachments = faviconPath
      ? [
          {
            filename: 'bizzbean-favicon.jpg',
            path: faviconPath,
            cid: FAVICON_CID,
            contentDisposition: 'inline' as const,
          },
        ]
      : [];

    const textContent = `
bizzbean™
your SANDBOX is ready

Hi, ${displayName}

Thank you for creating a SANDBOX account with us at bizzbean. We hope that by doing this we can help you discover, build, grow and even enable investment in your entrepreneurial ABILITY.

Please download your free copy of our book 'getting to value'. Also, keep an eye out for any message notifications. If you have an idea for a business model-set or an education programme, please use TALK TO US - we promise to consider all submissions.

You can update your business profile in the 'about', located in the top left of the landing page. When updated, you can use it to market your business.

We wish you all the best with your entrepreneurial journey.

Enter your sandbox: ${loginLink}
Download 'getting to value' book: ${bookDownloadLink}

sincerely,
the bizzbean team

----------------------------------------------------------------------
instant viability. infinite wisdom. always on.
----------------------------------------------------------------------
Security notice: This email was sent to ${recipientEmail} because a sandbox account was created at bizzbean. If you did not create this account, please notify us immediately at ${config.fromEmail}.
    `.trim();

    const htmlContent = buildWelcomeEmailHtml({
      displayName,
      recipientEmail,
      loginLink,
      bookDownloadLink,
      logoSrc,
      fromEmail: config.fromEmail,
      isSimulationTest: Boolean(isSimulationTest),
    });

    const subject = isSimulationTest
      ? '[TEST PREVIEW] your SANDBOX is ready — welcome to bizzbean'
      : 'your SANDBOX is ready — welcome to bizzbean';

    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: recipientEmail,
      replyTo: config.fromEmail,
      subject,
      text: textContent,
      html: htmlContent,
      attachments,
    });

    console.log(
      `[Email Service] Welcome email dispatched to ${recipientEmail} (logo: ${faviconPath ? 'inline CID bizzbean-favicon.jpg' : 'url fallback'}). MessageId: ${info.messageId}`
    );

    return res.json({
      success: true,
      messageId: info.messageId,
      recipient: recipientEmail,
      sender: config.fromEmail,
      logoAttachedInline: Boolean(faviconPath),
    });
  } catch (err: any) {
    console.error('[Email Service Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to dispatch welcome email.',
      code: err.code,
    });
  }
});

export default emailRouter;
