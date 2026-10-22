import { Router } from 'express';
import crypto from 'crypto';

const payfastRouter = Router();

// PayFast Config with Fallback to Production Credentials
const getPayfastConfig = () => {
  const rawSandbox = (process.env.PAYFAST_SANDBOX || '').trim().toLowerCase();
  const isSandbox = rawSandbox === 'true' || rawSandbox === '1' || rawSandbox === 'sandbox';

  // Production credentials for BizzBean (Merchant ID 14980265)
  const defaultMerchantId = isSandbox ? '10000100' : '14980265';
  const defaultMerchantKey = isSandbox ? '46f0cd694581a' : '2pbjmrcu6djwj';
  const defaultPassphrase = isSandbox ? '' : 'w2W2i4eo2R4eL789A2a45';

  const merchantId = process.env.PAYFAST_MERCHANT_ID || defaultMerchantId;
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY || defaultMerchantKey;
  const passphrase = process.env.PAYFAST_PASSPHRASE !== undefined
    ? process.env.PAYFAST_PASSPHRASE
    : defaultPassphrase;

  return {
    merchantId,
    merchantKey,
    passphrase,
    isSandbox,
    processUrl: isSandbox 
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process'
  };
};

/**
 * Generates MD5 signature required by PayFast for form submissions and ITN verification.
 */
function generateSignature(data: Record<string, string>, passphrase?: string): string {
  let pfParamString = '';

  // Sort keys or iterate in insertion order without signature
  Object.keys(data).forEach((key) => {
    if (key !== 'signature' && data[key] !== undefined && data[key] !== '') {
      const val = encodeURIComponent(data[key].trim()).replace(/%20/g, '+');
      pfParamString += `${key}=${val}&`;
    }
  });

  // Remove trailing ampersand
  pfParamString = pfParamString.slice(0, -1);

  if (passphrase) {
    const pfPass = encodeURIComponent(passphrase.trim()).replace(/%20/g, '+');
    pfParamString += `&passphrase=${pfPass}`;
  }

  return crypto.createHash('md5').update(pfParamString).digest('hex');
}

/**
 * GET /api/payfast/config
 * Returns general PayFast integration status
 */
payfastRouter.get('/config', (req, res) => {
  const config = getPayfastConfig();
  res.json({
    active: true,
    merchantId: config.merchantId,
    isSandbox: config.isSandbox,
    processUrl: config.processUrl
  });
});

/**
 * POST /api/payfast/checkout
 * Generates signed payment form payload for PayFast redirect
 */
payfastRouter.post('/checkout', (req, res) => {
  try {
    const { 
      amount, 
      itemName, 
      itemDescription, 
      userEmail, 
      userFirstName, 
      userLastName,
      paymentId,
      returnUrl,
      cancelUrl
    } = req.body;

    if (!amount || !itemName) {
      return res.status(400).json({ error: 'amount and itemName are required parameters.' });
    }

    const config = getPayfastConfig();
    const reqHost = req.headers['x-forwarded-host'] || req.headers.host;
    const reqProto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    const dynamicOrigin = reqHost ? `${reqProto}://${reqHost}` : null;
    const appUrl = process.env.APP_URL || dynamicOrigin || 'http://localhost:3000';

    const formattedAmount = Number(amount).toFixed(2);
    const mPaymentId = paymentId || `PF_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const payfastFields: Record<string, string> = {
      merchant_id: config.merchantId,
      merchant_key: config.merchantKey,
      return_url: returnUrl || `${appUrl}?payfast_status=success&payment_id=${mPaymentId}`,
      cancel_url: cancelUrl || `${appUrl}?payfast_status=cancelled`,
      notify_url: `${appUrl}/api/payfast/notify`,
      name_first: userFirstName || 'BizzBean',
      name_last: userLastName || 'Member',
      email_address: userEmail || 'member@bizzbean.co.za',
      m_payment_id: mPaymentId,
      amount: formattedAmount,
      item_name: itemName,
      item_description: itemDescription || 'BizzBean Platform Service / Token Credits'
    };

    // Generate MD5 signature
    const signature = generateSignature(payfastFields, config.passphrase);
    payfastFields.signature = signature;

    res.json({
      processUrl: config.processUrl,
      fields: payfastFields,
      paymentId: mPaymentId
    });
  } catch (err: any) {
    console.error('PayFast checkout error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate PayFast payment link.' });
  }
});

/**
 * POST /api/payfast/notify
 * PayFast Instant Transaction Notification (ITN) webhook handler
 */
payfastRouter.post('/notify', (req, res) => {
  try {
    console.log('Received PayFast ITN notification:', req.body);
    const config = getPayfastConfig();

    const pfData = req.body;
    const receivedSignature = pfData.signature;

    // Remove signature to re-calculate MD5 hash
    const dataToVerify: Record<string, string> = { ...pfData };
    delete dataToVerify.signature;

    const calculatedSignature = generateSignature(dataToVerify, config.passphrase);

    if (receivedSignature !== calculatedSignature) {
      console.warn('PayFast ITN signature mismatch!');
      return res.status(400).send('Invalid signature');
    }

    const paymentStatus = pfData.payment_status;
    const mPaymentId = pfData.m_payment_id;
    const amountGross = pfData.amount_gross;

    console.log(`PayFast ITN verified for ${mPaymentId}: Status = ${paymentStatus}, Amount = R${amountGross}`);

    // If payment is COMPLETE, confirm transaction
    if (paymentStatus === 'COMPLETE') {
      console.log(`Successfully processed PayFast order ${mPaymentId}`);
      // In V2: write transaction to Firestore or transactions collection here
    }

    res.status(200).send('OK');
  } catch (err: any) {
    console.error('PayFast ITN handler error:', err);
    res.status(500).send('Internal Server Error');
  }
});

export default payfastRouter;
