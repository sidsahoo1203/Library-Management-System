const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  finePerDay: { type: Number, default: 10 },
  loanDurationDays: { type: Number, default: 14 },
  libraryName: { type: String, default: 'University Library' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
