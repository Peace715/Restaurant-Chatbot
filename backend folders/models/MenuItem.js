const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    enum: ['foods', 'drinks', 'smoothies', 'parfait'],
    default: 'foods'
  },
  description: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  options: [String]
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
