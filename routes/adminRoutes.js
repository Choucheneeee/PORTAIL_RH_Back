const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const adminController = require("../controllers/adminController");
const { allusers,updateruser,deleteuser,getData } = require("../controllers/adminController");

// router.get("/getuser", authMiddleware, getuser);

router.get("/allusers", authMiddleware, allusers);
router.put("/updateruser", authMiddleware, updateruser);
router.delete("/deleteuser/:userId", authMiddleware, deleteuser);

router.get("/dashData",authMiddleware,getData)





module.exports = router;
