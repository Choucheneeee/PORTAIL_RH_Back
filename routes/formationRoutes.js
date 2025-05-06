// Routes de gestion des demandes
const express = require("express");
const Formation = require("../models/formation.model");
const router = express.Router();
const {  createformation } = require("../controllers/formationController");
const auth = require("../middleware/auth");


router.post("/", auth, createformation);







module.exports = router;