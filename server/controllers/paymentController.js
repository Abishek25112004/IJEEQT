// controllers/paymentController.js
// Razorpay payment integration for Article Processing Charges (APC)

const Razorpay = require("razorpay");
const crypto = require("crypto");
const { db } = require("../config/firebase");

// Initialize Razorpay with env credentials
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

/**
 * POST /api/payments/create-order
 * Creates a Razorpay order for APC (Article Processing Charge)
 */
const createOrder = async (req, res) => {
  const { paperId, amount = 5000 } = req.body; // amount in INR paise (5000 = ₹50)

  if (!paperId) {
    return res.status(400).json({ error: "Paper ID is required" });
  }

  // Verify paper exists and belongs to user
  const paperDoc = await db.collection("papers").doc(paperId).get();
  if (!paperDoc.exists) {
    return res.status(404).json({ error: "Paper not found" });
  }

  const paper = paperDoc.data();
  if (paper.authorId !== req.user.uid && req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  // Check if payment already completed
  const existingPayment = await db.collection("payments")
    .where("paperId", "==", paperId)
    .where("status", "==", "paid")
    .get();

  if (!existingPayment.empty) {
    return res.status(409).json({ error: "Payment already completed for this paper" });
  }

  // Create Razorpay order
  const options = {
    amount: amount * 100, // Convert to paise
    currency: "INR",
    receipt: `receipt_${paperId}_${Date.now()}`,
    notes: {
      paperId,
      userId: req.user.uid,
      paperTitle: paper.title,
    },
  };

  const order = await razorpay.orders.create(options);

  // Store pending payment record in Firestore
  await db.collection("payments").add({
    userId: req.user.uid,
    paperId,
    amount: amount,
    currency: "INR",
    razorpayOrderId: order.id,
    status: "pending",
    createdAt: new Date().toISOString(),
  });

  res.json({
    orderId: order.id,
    currency: order.currency,
    amount: order.amount,
    keyId: process.env.RAZORPAY_KEY_ID,
    paperTitle: paper.title,
    userEmail: req.user.email,
    userName: req.user.name,
  });
};

/**
 * POST /api/payments/verify
 * Verifies Razorpay payment signature and updates status
 */
const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paperId } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing payment verification fields" });
  }

  // HMAC-SHA256 signature verification
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: "Payment signature verification failed" });
  }

  // Find and update the payment record
  const paymentQuery = await db.collection("payments")
    .where("razorpayOrderId", "==", razorpay_order_id)
    .limit(1)
    .get();

  if (paymentQuery.empty) {
    return res.status(404).json({ error: "Payment record not found" });
  }

  const paymentDoc = paymentQuery.docs[0];
  await paymentDoc.ref.update({
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
    status: "paid",
    paidAt: new Date().toISOString(),
  });

  // Mark paper as payment complete
  if (paperId) {
    await db.collection("papers").doc(paperId).update({
      paymentStatus: "paid",
      updatedAt: new Date().toISOString(),
    });
  }

  res.json({ message: "Payment verified successfully", paymentId: razorpay_payment_id });
};

/**
 * GET /api/payments/my-payments
 * Get current user's payment history
 */
const getMyPayments = async (req, res) => {
  const snapshot = await db.collection("payments")
    .where("userId", "==", req.user.uid)
    .orderBy("createdAt", "desc")
    .get();

  const payments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  res.json({ payments });
};

module.exports = { createOrder, verifyPayment, getMyPayments };
