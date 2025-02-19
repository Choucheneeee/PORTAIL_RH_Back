
const express = require("express");
const {getuser,updateuser,allusers } = require("../controllers/userController");
const router = express.Router();
const authMiddleware = require("../middleware/auth");



router.get("/getuser", authMiddleware, getuser);

router.get("/allusers",authMiddleware,allusers);

router.put("/updateuser", authMiddleware, updateuser);


module.exports = router;
