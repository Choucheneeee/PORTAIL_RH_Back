// Document model

const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: String,
  fileUrl: String, 
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Document", DocumentSchema);
