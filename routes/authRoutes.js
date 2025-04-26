// Routes d'authentification
const express = require("express");
const { registerUser, loginUser,approveUser,verifyEmail,forgotPassword,resetPassword  } = require("../controllers/authController");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

// Routes d'inscription et de vérification
router.post("/register", registerUser);
router.post("/verify-email", verifyEmail);

// Routes de connexion et d'approbation
router.post("/login", loginUser);
router.post("/approve-user", authMiddleware, approveUser); 

// Routes de récupération de mot de passe
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
