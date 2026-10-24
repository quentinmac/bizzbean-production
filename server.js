// server.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// src/server/payfastRouter.ts
import { Router } from "express";
import crypto from "crypto";
var payfastRouter = Router();
var getPayfastConfig = () => {
  const rawSandbox = (process.env.PAYFAST_SANDBOX || "").trim().toLowerCase();
  const isSandbox = rawSandbox === "true" || rawSandbox === "1" || rawSandbox === "sandbox";
  const defaultMerchantId = isSandbox ? "10000100" : "14980265";
  const defaultMerchantKey = isSandbox ? "46f0cd694581a" : "2pbjmrcu6djwj";
  const defaultPassphrase = isSandbox ? "" : "w2W2i4eo2R4eL789A2a45";
  const merchantId = process.env.PAYFAST_MERCHANT_ID || defaultMerchantId;
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY || defaultMerchantKey;
  const passphrase = process.env.PAYFAST_PASSPHRASE !== void 0 ? process.env.PAYFAST_PASSPHRASE : defaultPassphrase;
  return {
    merchantId,
    merchantKey,
    passphrase,
    isSandbox,
    processUrl: isSandbox ? "https://sandbox.payfast.co.za/eng/process" : "https://www.payfast.co.za/eng/process"
  };
};
function generateSignature(data, passphrase) {
  let pfParamString = "";
  Object.keys(data).forEach((key) => {
    if (key !== "signature" && data[key] !== void 0 && data[key] !== "") {
      const val = encodeURIComponent(data[key].trim()).replace(/%20/g, "+");
      pfParamString += `${key}=${val}&`;
    }
  });
  pfParamString = pfParamString.slice(0, -1);
  if (passphrase) {
    const pfPass = encodeURIComponent(passphrase.trim()).replace(/%20/g, "+");
    pfParamString += `&passphrase=${pfPass}`;
  }
  return crypto.createHash("md5").update(pfParamString).digest("hex");
}
payfastRouter.get("/config", (req, res) => {
  const config = getPayfastConfig();
  res.json({
    active: true,
    merchantId: config.merchantId,
    isSandbox: config.isSandbox,
    processUrl: config.processUrl
  });
});
payfastRouter.post("/checkout", (req, res) => {
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
      return res.status(400).json({ error: "amount and itemName are required parameters." });
    }
    const config = getPayfastConfig();
    const reqHost = req.headers["x-forwarded-host"] || req.headers.host;
    const reqProto = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
    const dynamicOrigin = reqHost ? `${reqProto}://${reqHost}` : null;
    const appUrl = process.env.APP_URL || dynamicOrigin || "http://localhost:3000";
    const formattedAmount = Number(amount).toFixed(2);
    const mPaymentId = paymentId || `PF_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const payfastFields = {
      merchant_id: config.merchantId,
      merchant_key: config.merchantKey,
      return_url: returnUrl || `${appUrl}?payfast_status=success&payment_id=${mPaymentId}`,
      cancel_url: cancelUrl || `${appUrl}?payfast_status=cancelled`,
      notify_url: `${appUrl}/api/payfast/notify`,
      name_first: userFirstName || "BizzBean",
      name_last: userLastName || "Member",
      email_address: userEmail || "member@bizzbean.co.za",
      m_payment_id: mPaymentId,
      amount: formattedAmount,
      item_name: itemName,
      item_description: itemDescription || "BizzBean Platform Service / Token Credits"
    };
    const signature = generateSignature(payfastFields, config.passphrase);
    payfastFields.signature = signature;
    res.json({
      processUrl: config.processUrl,
      fields: payfastFields,
      paymentId: mPaymentId
    });
  } catch (err) {
    console.error("PayFast checkout error:", err);
    res.status(500).json({ error: err.message || "Failed to generate PayFast payment link." });
  }
});
payfastRouter.post("/notify", (req, res) => {
  try {
    console.log("Received PayFast ITN notification:", req.body);
    const config = getPayfastConfig();
    const pfData = req.body;
    const receivedSignature = pfData.signature;
    const dataToVerify = { ...pfData };
    delete dataToVerify.signature;
    const calculatedSignature = generateSignature(dataToVerify, config.passphrase);
    if (receivedSignature !== calculatedSignature) {
      console.warn("PayFast ITN signature mismatch!");
      return res.status(400).send("Invalid signature");
    }
    const paymentStatus = pfData.payment_status;
    const mPaymentId = pfData.m_payment_id;
    const amountGross = pfData.amount_gross;
    console.log(`PayFast ITN verified for ${mPaymentId}: Status = ${paymentStatus}, Amount = R${amountGross}`);
    if (paymentStatus === "COMPLETE") {
      console.log(`Successfully processed PayFast order ${mPaymentId}`);
    }
    res.status(200).send("OK");
  } catch (err) {
    console.error("PayFast ITN handler error:", err);
    res.status(500).send("Internal Server Error");
  }
});
var payfastRouter_default = payfastRouter;

// server.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use("/api/payfast", payfastRouter_default);
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.resolve(__dirname, "dist"), {
      maxAge: "1h",
      index: false
    }));
    app.get("*", (_req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  } else {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
