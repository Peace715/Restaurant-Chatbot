const User = require('../models/User');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

async function handleChatbot(message, deviceId) {
  let user = await User.findOne({ deviceId });

  if (!user) {
    user = await User.create({ deviceId });
  }

  const menu = await MenuItem.find();

  // STEP 0: MAIN MENU
  if (message === "1" && user.currentStep === "idle") {
    user.currentStep = "select_item";
    await user.save();

    let response = "🍽️ Select a food item:\n";
    menu.forEach((item, i) => {
      response += `${i + 1}. ${item.name} - ₦${item.price}\n`;
    });

    return response;
  }

  // STEP 1: USER PICKS FOOD
  if (user.currentStep === "select_item") {
    const index = parseInt(message) - 1;
    const selected = menu[index];

    if (!selected) return "❌ Invalid choice. Try again.";

    user.tempOrder = {
      itemName: selected.name,
      price: selected.price
    };

    user.currentStep = "select_quantity";
    await user.save();

    return "🔢 How many plates do you want?";
  }

  // STEP 2: QUANTITY
  if (user.currentStep === "select_quantity") {
    const qty = parseInt(message);

    if (isNaN(qty) || qty <= 0) {
      return "❌ Enter a valid quantity";
    }

    user.tempOrder.quantity = qty;

    const total = user.tempOrder.price * qty;

    user.currentOrder.push({
      itemName: user.tempOrder.itemName,
      quantity: qty,
      price: total
    });

    user.currentStep = "idle";
    user.tempOrder = {};

    await user.save();

    return `✅ Added to cart!\n💰 Total: ₦${total}\n\nType 1 to order more or 99 to checkout`;
  }

  // VIEW CART
  if (message === "97") {
    if (!user.currentOrder.length) return "🛒 Cart is empty";

    let response = "🛒 Your Cart:\n";
    let total = 0;

    user.currentOrder.forEach((item) => {
      response += `${item.itemName} x${item.quantity} = ₦${item.price}\n`;
      total += item.price;
    });

    response += `\n💰 Total: ₦${total}`;
    return response;
  }

  // CHECKOUT
  if (message === "99") {
    if (!user.currentOrder.length) return "🛒 Cart is empty";

    let total = user.currentOrder.reduce((sum, item) => sum + item.price, 0);

    return `💳 Proceed to payment\nTotal: ₦${total}`;
  }

  return "Click to start ordering 🍽️";
}

module.exports = { handleChatbot };
