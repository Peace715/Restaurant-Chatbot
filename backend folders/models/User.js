const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  currentOrder: [
    {
      itemName: String,
      quantity: Number,
      price: Number
    }
  ],
  orderHistory: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }
  ],
  currentStep: {
  type: String,
  default: "idle"
},
tempOrder: {
  type: Object,
  default: {}
}
});

module.exports = mongoose.model('User', userSchema);