const mongoose = require("mongoose");


const Users = mongoose.model("Users", {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      unique: true,
    },
    expenses: [
      {
        date: Date,
        amount: Number,
        category: String,
        type: { type: String, enum: ["Income", "Expense"] },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  });

  module.exports = Users