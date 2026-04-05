// routes/payments.js
const express = require("express");
const router = express.Router();
const { createOrder, verifyPayment, getMyPayments } = require("../controllers/paymentController");
const { verifyToken } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");

router.post("/create-order", verifyToken, asyncHandler(createOrder));
router.post("/verify", verifyToken, asyncHandler(verifyPayment));
router.get("/my-payments", verifyToken, asyncHandler(getMyPayments));

module.exports = router;
