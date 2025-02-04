


const express = require("express");
const { registerUser, loginUser,approveUser,verifyEmail  } = require("../controllers/authController");
const router = express.Router();
const authMiddleware = require("../middleware/auth");


router.post("/register", registerUser);
router.post("/verify-email", verifyEmail);

router.post("/login", loginUser);
router.post("/approve-user", authMiddleware, approveUser); 
module.exports = router;
