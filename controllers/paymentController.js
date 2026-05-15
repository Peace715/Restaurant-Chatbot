const axios = require("axios");
const User = require("../models/User");

exports.initializePayment = async (req, res) => {
  try {
    const { deviceId } = req.body;

    const user = await User.findOne({ deviceId });

    if (!user || !user.currentOrder.length) {
      return res.status(400).json({ error: "No order found" });
    }

    const total = user.currentOrder.reduce(
      (sum, item) => sum + item.price,
      0
    );

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: "test@email.com",
        amount: total * 100, // Paystack uses kobo
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      paymentUrl: response.data.data.authorization_url,
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Payment failed" });
  }
};

exports.verifyPayment = async (req, res) => {
  const { reference } = req.params;

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (response.data.data.status === "success") {
      return res.json({ status: "success" });
    } else {
      return res.json({ status: "failed" });
    }
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ status: "error" });
  }
};