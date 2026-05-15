const express = require("express");
const router = express.Router();
const { initializePayment } = require("../controllers/paymentController");
const { verifyPayment } = require("../controllers/paymentController");

router.post("/pay", initializePayment);
router.get("/verify/:reference", verifyPayment);

module.exports = router;