// File: src/models/UserCard.js
const { mongoose } = require('mongoose');

const userCardSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
    required: true
  },
  version: {
    type: Number,
    required: true,
    default: 1
  },
  serialNumber: {
    type: String,
    required: true,
    unique: true
  },
  obtainedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('UserCard', userCardSchema);
