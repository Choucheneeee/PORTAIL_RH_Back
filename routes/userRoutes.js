
const express = require("express");
const {getuser,updateuser,allusers,approveUser,deleteuser } = require("../controllers/userController");
const router = express.Router();
const authMiddleware = require("../middleware/auth");




router.get("/getuser", authMiddleware, getuser);

router.get("/allusers",authMiddleware,allusers);

router.put("/updateuser", authMiddleware, updateuser);

router.put("/approveuser", authMiddleware, approveUser);

router.delete("/deleteuser/:userId", authMiddleware, deleteuser);


module.exports = router;
