/**
 * PayFast Frontend Service
 * Handles POST requests to /api/payfast/checkout and dynamic form generation/submission to PayFast.
 */

export interface PayfastCheckoutParams {
  amount: number;
  itemName: string;
  itemDescription?: string;
  userEmail?: string;
  userFirstName?: string;
  userLastName?: string;
  paymentId?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PayfastCheckoutResponse {
  processUrl: string;
  fields: Record<string, string>;
  paymentId: string;
}

/**
 * Initiates checkout via server router and dynamically submits form directly to PayFast.
 */
export async function initiatePayfastCheckout(params: PayfastCheckoutParams): Promise<void> {
  const response = await fetch('/api/payfast/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to initiate PayFast checkout session.');
  }

  const data: PayfastCheckoutResponse = await response.json();

  if (!data.processUrl || !data.fields) {
    throw new Error('Invalid response structure received from checkout server.');
  }

  // Create dynamic form and auto-submit to PayFast gateway
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = data.processUrl;
  form.style.display = 'none';

  Object.entries(data.fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = String(value);
      form.appendChild(input);
    }
  });

  document.body.appendChild(form);
  form.submit();
}

/**
 * Checks PayFast status from the server
 */
export async function getPayfastConfig(): Promise<{
  active: boolean;
  merchantId: string;
  isSandbox: boolean;
  processUrl: string;
}> {
  const response = await fetch('/api/payfast/config');
  if (!response.ok) {
    throw new Error('Could not fetch PayFast configuration.');
  }
  return response.json();
}
