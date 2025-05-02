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
  periode:{
    type:String,
    enum:[
      "Mensuel",
      "Annuel"
    ]
  },
  mois:String,
  annee:String,
  requestDetails:String,
  status:String
},
 {
  timestamps: true
});

module.exports = mongoose.model("Document", documentSchema);