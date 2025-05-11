const express = require("express");
const router = express.Router();
const {  createconge } = require("../controllers/congeController");
const auth = require("../middleware/auth");


router.post("/", auth, createconge);



module.exports = router;
