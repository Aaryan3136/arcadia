const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  itemId: {
    type: String,
    required: true
  },

  title: {
    type: String,
    required: true
  },

  category: {
    type: String,
    required: true
  }

}, {
  timestamps: true
});

module.exports = mongoose.model("Favorite", favoriteSchema);