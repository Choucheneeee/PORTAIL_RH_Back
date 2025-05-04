const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
    type: String,
    generatedFor: String,
    generatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        }
        },
 {
  timestamps: true
});


module.exports = mongoose.model("Document", documentSchema);