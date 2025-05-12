const Demande = require("../models/document.model");
const Formation = require("../models/formation.model");
const Conge = require("../models/conge.model");
const Avance = require("../models/avance.model");






exports.getAllRequests = async (req, res) => {
  try {
    const demandes = await Demande.find();
    const formations= await Formation.find();
    const conges= await Conge.find();
    const avances= await Avance.find();

    res.status(200).json(
        { demandes, formations, conges, avances }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};