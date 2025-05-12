const express = require("express");
const router = express.Router();
const {
getAllRequests,
} = require("../controllers/demandeController");

const auth = require("../middleware/auth");



router.get("/", auth, getAllRequests);






module.exports = router;