// controllers/paymentController.js
// Razorpay payment integration for Article Processing Charges (APC)

const Razorpay = require("razorpay");
const crypto = require("crypto");
const prisma = require("../config/db");

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
  const { paperId, amount = 5000 } = req.body;

  if (!paperId) {
    return res.status(400).json({ error: "Paper ID is required" });
  }

  try {
    const paper = await prisma.paper.findUnique({ where: { id: paperId }});
    if (!paper) {
      return res.status(404).json({ error: "Paper not found" });
    }

    if (paper.authorId !== req.user.uid && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const existingPayment = await prisma.payment.findFirst({
      where: {
        paperId: paperId,
        status: "paid"
      }
    });

    if (existingPayment) {
      return res.status(409).json({ error: "Payment already completed for this paper" });
    }

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

    await prisma.payment.create({
      data: {
        paperId,
        amount: amount,
        razorpayOrderId: order.id,
        status: "pending",
      }
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
  } catch (error) {
    console.error("Error creating payment order:", error);
    // Send back the specific Razorpay error if it exists, otherwise a generic one
    const errorMessage = error.error?.description || error.message || "Internal server error";
    res.status(500).json({ error: errorMessage });
  }
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

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: "Payment signature verification failed" });
  }

  try {
    const payment = await prisma.payment.findFirst({
      where: { razorpayOrderId: razorpay_order_id }
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment record not found" });
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        status: "paid",
      }
    });

    res.json({ message: "Payment verified successfully", paymentId: razorpay_payment_id });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/payments/my-payments
 * Get current user's payment history
 */
const getMyPayments = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: {
        paper: {
          authorId: req.user.uid
        }
      },
      orderBy: { createdAt: "desc" },
      include: {
        paper: {
           select: { title: true }
        }
      }
    });

    res.json({ payments });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { createOrder, verifyPayment, getMyPayments };
