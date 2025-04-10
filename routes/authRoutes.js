


const express = require("express");
const { registerUser, loginUser,approveUser,verifyEmail,forgotPassword,resetPassword  } = require("../controllers/authController");
const router = express.Router();
const authMiddleware = require("../middleware/auth");


router.post("/register", registerUser);
router.post("/verify-email", verifyEmail);

router.post("/login", loginUser);
router.post("/approve-user", authMiddleware, approveUser); 

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
