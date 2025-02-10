
const express = require("express");
const {getuser } = require("../controllers/userController");
const router = express.Router();
const authMiddleware = require("../middleware/auth");



router.get("/getuser", authMiddleware, getuser); // Protect this routeS


module.exports = router;
