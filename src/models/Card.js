const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Card name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Card name cannot be longer than 50 characters']
  },
  type: {
    type: String,
    required: [true, 'Card type is required'],
    enum: {
      values: ['Character', 'Spell', 'Item', 'Environment'],
      message: '{VALUE} is not a valid card type'
    },
    trim: true
  },
  rarity: {
    type: String,
    required: [true, 'Card rarity is required'],
    enum: {
      values: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'],
      message: '{VALUE} is not a valid rarity'
    },
    default: 'Common'
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required'],
    validate: {
      validator: function(v) {
        return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?(\?.*)?$/.test(v);
      },
      message: 'Please enter a valid URL'
    }
  },
  description: {
    type: String,
    required: [true, 'Card description is required'],
    trim: true,
    maxlength: [500, 'Description cannot be longer than 500 characters']
  },
  stats: {
    attack: {
      type: Number,
      min: [0, 'Attack cannot be negative'],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Attack must be a whole number'
      }
    },
    defense: {
      type: Number,
      min: [0, 'Defense cannot be negative'],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Defense must be a whole number'
      }
    },
    cost: {
      type: Number,
      required: [true, 'Cost is required'],
      min: [0, 'Cost cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Cost must be a whole number'
      }
    }
  },
  createdBy: {
    type: String,
    required: [true, 'Creator ID is required']
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  }
});

cardSchema.index({ name: 1 }, { unique: true });
cardSchema.index({ type: 1 });
cardSchema.index({ rarity: 1 });
cardSchema.index({ 'stats.cost': 1 });

const Card = mongoose.models.Card || mongoose.model('Card', cardSchema);

module.exports = Card;
