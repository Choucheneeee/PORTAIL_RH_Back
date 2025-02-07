
const express = require("express");
const {getalluser } = require("../controllers/userController");
const router = express.Router();
const authMiddleware = require("../middleware/auth");



router.get("/allEmployeers", authMiddleware, getalluser); // Protect this route


module.exports = router;
