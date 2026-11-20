/**
 * Email Service (Frontend)
 * Dispatches onboarding welcome emails, renders live email previews, and checks SMTP status via /api/email endpoints.
 */

export interface SendWelcomeEmailParams {
  recipientEmail: string;
  recipientName: string;
  firstName?: string;
  companyName?: string;
  /** Must be true for brand-new client sign-ups; false suppresses dispatch at the server layer too */
  isNewClientSignup?: boolean;
  /** True only when triggered explicitly from the Admin Onboarding Simulation Test Lab */
  isSimulationTest?: boolean;
}

export interface SendWelcomeEmailResult {
  success: boolean;
  suppressed?: boolean;
  reason?: string;
  messageId?: string;
  recipient?: string;
  sender?: string;
  logoAttachedInline?: boolean;
  error?: string;
}

export interface WelcomeEmailPreviewResult {
  success: boolean;
  subject?: string;
  sender?: string;
  logoAsset?: string;
  logoFoundOnDisk?: boolean;
  html?: string;
  error?: string;
}

/**
 * Sends the official "your SANDBOX is ready" welcome email via the backend Xneelo SMTP server.
 * Only executes for brand-new client registrations (or explicit admin simulation tests).
 */
export async function sendWelcomeEmail(params: SendWelcomeEmailParams): Promise<SendWelcomeEmailResult> {
  if (params.isNewClientSignup === false && !params.isSimulationTest) {
    return {
      success: true,
      suppressed: true,
      reason: 'Existing client sign-in detected — welcome email suppressed.',
      recipient: params.recipientEmail,
    };
  }

  try {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const response = await fetch('/api/email/send-welcome', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        isNewClientSignup: params.isNewClientSignup ?? true,
        isSimulationTest: Boolean(params.isSimulationTest),
        appUrl: currentOrigin,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.warn('Welcome email dispatch notice:', data.error);
      return {
        success: false,
        error: data.error || 'Failed to dispatch welcome email.',
      };
    }

    return {
      success: true,
      suppressed: Boolean(data.suppressed),
      reason: data.reason,
      messageId: data.messageId,
      recipient: data.recipient,
      sender: data.sender,
      logoAttachedInline: Boolean(data.logoAttachedInline),
    };
  } catch (err: any) {
    console.warn('Welcome email request error:', err);
    return {
      success: false,
      error: err.message || 'Network error while attempting to send welcome email.',
    };
  }
}

/**
 * Fetches the exact rendered HTML of the "your SANDBOX is ready" welcome email for preview in the Onboarding Simulator.
 */
export async function fetchWelcomeEmailPreview(params: {
  recipientEmail: string;
  recipientName: string;
  firstName?: string;
  isSimulationTest?: boolean;
}): Promise<WelcomeEmailPreviewResult> {
  try {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const response = await fetch('/api/email/preview-welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        appUrl: currentOrigin,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to render welcome email preview.',
      };
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error loading welcome email preview.',
    };
  }
}

/**
 * Retrieves the current SMTP server status and configured sender address
 */
export async function getEmailStatus(): Promise<{
  configured: boolean;
  host: string;
  port: number;
  secure: boolean;
  sender: string;
  accountUser: string;
  logoAssetReady?: boolean;
  logoFilename?: string;
}> {
  const response = await fetch('/api/email/status');
  if (!response.ok) {
    throw new Error('Failed to retrieve email service status.');
  }
  return response.json();
}

/**
 * Triggers a test email to verify SMTP connection
 */
export async function testSmtpConnection(targetEmail?: string): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const response = await fetch('/api/email/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetEmail }),
  });
  return response.json();
}
