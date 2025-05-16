const express = require("express");
const router = express.Router();
const {  createavance } = require("../controllers/avanceCotroller");
const auth = require("../middleware/auth");


router.post("/", auth, createavance);



module.exports = router;
