
const express = require("express");
const {getuser,updateuser } = require("../controllers/userController");
const router = express.Router();
const authMiddleware = require("../middleware/auth");



router.get("/getuser", authMiddleware, getuser);

router.put("/updateuser", authMiddleware, updateuser);


module.exports = router;
