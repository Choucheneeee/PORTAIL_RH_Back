
const express = require("express");
const {getuser,updateuser,allusers,approveUser,deleteuser } = require("../controllers/userController");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const upload = require('../utils/upload'); // Assuming you have a file upload utility
const nestFormatter = require('../utils/nestFormatter'); // Assuming you have a file upload utility




router.get("/getuser", authMiddleware, getuser);

router.get("/allusers",authMiddleware,allusers);

router.put("/updateuser", authMiddleware,upload.single('profileImage'),nestFormatter, updateuser);

router.put("/approveuser", authMiddleware, approveUser);

router.delete("/deleteuser/:userId", authMiddleware, deleteuser);


module.exports = router;
