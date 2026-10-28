const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Wallet balance cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
