const express = require("express");
const router = express.Router();
const MenuItem = require("../models/MenuItem");
const User = require("../models/User");

function summarizeCart(items) {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  return { items, total };
}

async function findOrCreateUser(deviceId) {
  let user = await User.findOne({ deviceId });

  if (!user) {
    user = await User.create({ deviceId });
  }

  return user;
}

router.get("/:deviceId", async (req, res) => {
  try {
    const user = await User.findOne({ deviceId: req.params.deviceId });

    if (!user) {
      return res.json(summarizeCart([]));
    }

    res.json(summarizeCart(user.currentOrder));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/add", async (req, res) => {
  try {
    const { deviceId, itemId, quantity } = req.body;
    const qty = Number(quantity);

    if (!deviceId || !itemId || !Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ error: "Invalid cart item" });
    }

    const selected = await MenuItem.findById(itemId);

    if (!selected) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    const user = await findOrCreateUser(deviceId);

    user.currentOrder.push({
      itemName: selected.name,
      quantity: qty,
      price: selected.price * qty,
    });
    user.currentStep = "idle";
    user.tempOrder = {};

    await user.save();

    res.json({
      ...summarizeCart(user.currentOrder),
      message: `${selected.name} added to cart`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:deviceId", async (req, res) => {
  try {
    const user = await User.findOne({ deviceId: req.params.deviceId });

    if (!user) {
      return res.json(summarizeCart([]));
    }

    user.currentOrder = [];
    user.currentStep = "idle";
    user.tempOrder = {};
    await user.save();

    res.json(summarizeCart([]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
