const mongoose = require("mongoose");

const activiteSchema = new mongoose.Schema({
    user:String,
    type:String,
    description:String,
    statut:String
    },
    {
    timestamps: true
    }
)
module.exports = mongoose.model("activite", activiteSchema);