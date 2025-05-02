const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      "attestation",
      "fiche_paie",
      "certificat",
    ]
  },
  
  expiresAt: Date,
}, {
  timestamps: true
});

module.exports = mongoose.model("Document", documentSchema);