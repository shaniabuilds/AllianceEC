const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'State code is required (e.g. KA, DL, MH)'],
      unique: true,
      uppercase: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'State name is required'],
      trim: true
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const State = mongoose.model('State', stateSchema);

module.exports = State;
