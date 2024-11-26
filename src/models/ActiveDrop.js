const mongoose = require('mongoose');

const activeDropSchema = new mongoose.Schema({
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
    required: true,
  },
  messageId: {
    type: String,
    required: true,
  },
  channelId: {
    type: String,
    required: true,
  },
  version: {
    type: Number,
    required: true,
    default: 1,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  claimed: {
    type: Boolean,
    default: false,
  },
  claimedBy: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model('ActiveDrop', activeDropSchema);
