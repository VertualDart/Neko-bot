// File: src/models/UserInventory.js
var mongoose = require('mongoose');

var inventorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  cards: [
    {
      cardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Card',
        required: true
      },
      version: {
        type: Number,
        required: true
      },
      serialNumber: {
        type: String,
        required: true
      },
      obtainedAt: {
        type: Date,
        default: Date.now
      },
      favorite: {
        type: Boolean,
        default: false
      }
    }
  ]
});

module.exports = mongoose.model('UserInventory', inventorySchema);
