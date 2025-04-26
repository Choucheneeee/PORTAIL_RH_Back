// Routes de gestion des utilisateurs
const express = require("express");
const {getuser,updateuser,allusers,approveUser,deleteuser } = require("../controllers/userController");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const upload = require('../utils/upload'); // Utilitaire de téléchargement de fichiers
const nestFormatter = require('../utils/nestFormatter'); // Utilitaire de formatage

// Routes protégées nécessitant une authentification
router.get("/getuser", authMiddleware, getuser);
router.get("/allusers", authMiddleware, allusers);
router.put("/updateuser", authMiddleware, upload.single('profileImage'), nestFormatter, updateuser);
router.put("/approveuser", authMiddleware, approveUser);
router.delete("/deleteuser/:userId", authMiddleware, deleteuser);

module.exports = router;
