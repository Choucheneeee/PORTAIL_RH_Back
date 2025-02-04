// Requests model

const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { 
    type: String, 
    enum: ["document", "formation", "congé", "prêt", "avance"], 
    required: true 
  },
  status: { type: String, enum: ["en attente", "validé", "rejeté"], default: "en attente" },
  details: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

module.exports = mongoose.model("Request", RequestSchema);
