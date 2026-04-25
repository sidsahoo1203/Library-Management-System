const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: true
    },
    barcodeId: {
      type: String,
      unique: true,
      sparse: true // allows multiple nulls if not generated yet
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Student', studentSchema);
