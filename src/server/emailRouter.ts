import { Router } from 'express';
import nodemailer from 'nodemailer';

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

/**
 * GET /api/email/status
 * Returns SMTP server status and configured sender
 */
emailRouter.get('/status', async (req, res) => {
  try {
    const config = getSmtpConfig();
    res.json({
      configured: Boolean(config.host && config.user),
      host: config.host,
      port: config.port,
      secure: config.secure,
      sender: `"${config.fromName}" <${config.fromEmail}>`,
      accountUser: config.user,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get email status.' });
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
 * Dispatches the official "your SANDBOX is ready" welcome email to new members upon registration
 */
emailRouter.post('/send-welcome', async (req, res) => {
  try {
    const { recipientEmail, recipientName, firstName, companyName, appUrl } = req.body;

    if (!recipientEmail || typeof recipientEmail !== 'string') {
      return res.status(400).json({ error: 'recipientEmail is required.' });
    }

    const config = getSmtpConfig();
    const transporter = createTransporter();

    const displayName = firstName?.trim() || recipientName?.trim() || recipientEmail.split('@')[0] || 'Entrepreneur';
    const safeCompany = companyName?.trim() || 'your venture';
    const reqHost = req.headers['x-forwarded-host'] || req.headers.host;
    const reqProto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    const dynamicOrigin = reqHost ? `${reqProto}://${reqHost}` : null;
    const liveAppUrl = appUrl || process.env.APP_URL || dynamicOrigin || 'https://www.bizzbean.com';

    const loginLink = `${liveAppUrl}?verified=true&email=${encodeURIComponent(recipientEmail)}`;
    const bookDownloadLink = `${liveAppUrl}?action=download-book`;

    // Exact text matching "your sandbox is open.png" / "your_sandbox_is_open_9a2f4002.png"
    const textContent = `
bizzbean™
your SANDBOX is ready

Hi, ${displayName}

Thank you for creating a SANDBOX account with us at bizzbean. We hope that by doing this we can help you discover, build, grow and even invest in your entrepreneurial ABILITY.

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

    // Responsive HTML Email matching exact BizzBean letter styling
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>your SANDBOX is ready</title>
</head>
<body style="margin: 0; padding: 0; background-color: #EBF1F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #EBF1F6; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" max-width="640" cellspacing="0" cellpadding="0" border="0" style="max-width: 640px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #D8CEBC;">
          
          <!-- Top Accent Bar -->
          <tr>
            <td style="background-color: #4C7B9E; height: 12px; line-height: 12px; font-size: 1px;">&nbsp;</td>
          </tr>

          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding: 36px 30px 10px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                <tr>
                  <td valign="middle" style="padding-right: 10px;">
                    <!-- Circular Icon Symbol -->
                    <div style="width: 38px; height: 38px; border-radius: 50%; border: 3px solid #3A5D7C; background: #FFFFFF; text-align: center; line-height: 38px; font-weight: bold; color: #84CC16; font-size: 20px;">
                      ●
                    </div>
                  </td>
                  <td valign="middle">
                    <span style="font-size: 34px; font-weight: 300; letter-spacing: -0.5px; color: #3A5D7C; font-family: 'Century Gothic', -apple-system, sans-serif;">
                      bizz<strong style="font-weight: 600; color: #3A5D7C;">bean</strong>
                    </span>
                    <span style="font-size: 11px; vertical-align: top; color: #64748B;">™</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Title: your SANDBOX is ready -->
          <tr>
            <td align="center" style="padding: 10px 30px 24px 30px;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 400; color: #2E5E88; font-family: 'Century Gothic', -apple-system, sans-serif; letter-spacing: 0.5px;">
                your <span style="font-weight: 700; letter-spacing: 1.5px;">SANDBOX</span> is ready
              </h1>
            </td>
          </tr>

          <!-- Greeting & Letter Body -->
          <tr>
            <td style="padding: 10px 42px 30px 42px; font-size: 15px; line-height: 1.7; color: #254B6D;">
              
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #2E5E88; font-weight: 500;">
                Hi, '${displayName}'
              </p>

              <p style="margin: 0 0 18px 0; color: #2E5E88; font-size: 15px;">
                Thank you for creating a <strong>SANDBOX</strong> account with us at <strong>bizzbean</strong>. We hope that by doing this we can help you discover, build, grow and even invest in your entrepreneurial <strong>ABILITY</strong>.
              </p>

              <p style="margin: 0 0 18px 0; color: #2E5E88; font-size: 15px;">
                Please download your free copy of our book <strong>'getting to value'</strong>. Also, keep an eye out for any message notifications. If you have an idea for a business model-set or an education programme, please use <strong>TALK TO US</strong> - we promise to consider all submissions.
              </p>

              <p style="margin: 0 0 22px 0; color: #2E5E88; font-size: 15px;">
                You can update your business profile in the <strong>'about'</strong>, located in the top left of the landing page. When updated, you can use it to market your business.
              </p>

              <p style="margin: 0 0 26px 0; color: #2E5E88; font-size: 15px;">
                We wish you all the best with your entrepreneurial journey.
              </p>

              <!-- Action Buttons Container -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" style="padding-right: 12px;">
                          <a href="${loginLink}" target="_blank" style="display: inline-block; background-color: #2E5E88; color: #FFFFFF; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; text-decoration: none; padding: 13px 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(46, 94, 136, 0.25);">
                            ENTER MY SANDBOX →
                          </a>
                        </td>
                        <td align="center">
                          <a href="${bookDownloadLink}" target="_blank" style="display: inline-block; background-color: #FFFFFF; color: #2E5E88; border: 1.5px solid #2E5E88; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; text-decoration: none; padding: 11.5px 22px; border-radius: 12px;">
                            DOWNLOAD BOOK
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Sign-off -->
              <div style="margin-top: 24px;">
                <p style="margin: 0; font-style: italic; color: #4B6E8F; font-size: 14px;">sincerely,</p>
                <p style="margin: 4px 0 0 0; font-weight: bold; font-size: 15px; color: #1E3A56;">the bizzbean team</p>
              </div>

            </td>
          </tr>

          <!-- Green Footer Tagline (Matching letter screenshot) -->
          <tr>
            <td align="center" style="background-color: #8EB737; padding: 15px 20px;">
              <span style="font-size: 14px; font-weight: 500; color: #FFFFFF; letter-spacing: 0.6px; font-family: 'Century Gothic', -apple-system, sans-serif;">
                instant viability. infinite wisdom. always on.
              </span>
            </td>
          </tr>

        </table>

        <!-- Security / Anti-Impersonation Footer -->
        <table role="presentation" width="100%" max-width="640" cellspacing="0" cellpadding="0" border="0" style="max-width: 640px; margin-top: 16px;">
          <tr>
            <td align="center" style="font-size: 11px; color: #64748B; line-height: 1.6; font-family: monospace;">
              This onboarding email was dispatched to <strong>${recipientEmail}</strong> for security verification.<br>
              If you did not register this sandbox, please report it to <a href="mailto:${config.fromEmail}" style="color: #2E5E88;">${config.fromEmail}</a>.<br>
              © ${new Date().getFullYear()} bizzbean™. All rights reserved.
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: recipientEmail,
      replyTo: config.fromEmail,
      subject: 'your SANDBOX is ready — welcome to bizzbean',
      text: textContent,
      html: htmlContent,
    });

    console.log(`[Email Service] Welcome email dispatched to ${recipientEmail}. MessageId: ${info.messageId}`);

    return res.json({
      success: true,
      messageId: info.messageId,
      recipient: recipientEmail,
      sender: config.fromEmail,
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
