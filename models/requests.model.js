const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
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
      "mensuel",
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


module.exports = mongoose.model("Request", requestSchema);