/**
 * Email Service (Frontend)
 * Dispatches onboarding welcome emails and checks SMTP status via /api/email endpoints.
 */

export interface SendWelcomeEmailParams {
  recipientEmail: string;
  recipientName: string;
  firstName?: string;
  companyName?: string;
}

export interface SendWelcomeEmailResult {
  success: boolean;
  messageId?: string;
  recipient?: string;
  sender?: string;
  error?: string;
}

/**
 * Sends the official "your SANDBOX is ready" welcome email via the backend Xneelo SMTP server
 */
export async function sendWelcomeEmail(params: SendWelcomeEmailParams): Promise<SendWelcomeEmailResult> {
  try {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const response = await fetch('/api/email/send-welcome', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
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
      messageId: data.messageId,
      recipient: data.recipient,
      sender: data.sender,
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
 * Retrieves the current SMTP server status and configured sender address
 */
export async function getEmailStatus(): Promise<{
  configured: boolean;
  host: string;
  port: number;
  secure: boolean;
  sender: string;
  accountUser: string;
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
