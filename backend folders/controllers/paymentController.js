const axios = require("axios");
const User = require("../models/User");

exports.initializePayment = async (req, res) => {
  try {
    const { deviceId, callbackUrl } = req.body;

    const user = await User.findOne({ deviceId });

    if (!user || !user.currentOrder.length) {
      return res.status(400).json({ error: "No order found" });
    }

    const total = user.currentOrder.reduce(
      (sum, item) => sum + item.price,
      0
    );
    const reference = `restaurant-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
    const fallbackCallbackUrl = `${req.protocol}://${req.get("host")}/`;

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: "test@email.com",
        amount: total * 100, // Paystack uses kobo
        reference,
        callback_url: callbackUrl || fallbackCallbackUrl,
        metadata: {
          deviceId,
          orderItems: user.currentOrder,
        },
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
      reference,
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({
      error: "Payment could not start",
      details: err.response?.data?.message || err.message,
    });
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

    const transaction = response.data.data;

    if (transaction.status === "success") {
      const deviceId = transaction.metadata?.deviceId;

      if (deviceId) {
        await User.findOneAndUpdate(
          { deviceId },
          { currentOrder: [], currentStep: "idle", tempOrder: {} }
        );
      }

      return res.json({
        status: "success",
        message: transaction.gateway_response || "Payment successful",
      });
    }

    return res.json({
      status: transaction.status || "failed",
      message: transaction.gateway_response || "Payment was not completed",
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({
      status: "error",
      message: err.response?.data?.message || "Payment verification failed",
    });
  }
};
