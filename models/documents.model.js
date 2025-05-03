const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
  type: {
    type: String,
    required: true,
    enum: [
      "attestation",
      "fiche_paie",
      "certificat",
    ]
  },
  firstName:String,
  lastName:String,
  periode:{
    type:String,
    enum:[
      "mensuel",
      "Annuel"
    ]
  },
  mois:String,
  annee:String,
 documenttDetails:String,
  status:String
},
 {
  timestamps: true
});


module.exports = mongoose.model("Request", documentSchema);