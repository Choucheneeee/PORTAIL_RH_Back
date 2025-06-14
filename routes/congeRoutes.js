const express = require("express");
const router = express.Router();
const {  createconge,getCongeById,updateConge,gegsolde } = require("../controllers/congeController");
const auth = require("../middleware/auth");


router.post("/", auth, createconge);
router.get("/:id", auth, getCongeById);
router.put("/update/:id", auth, updateConge);
router.get("/solde/:id",auth,gegsolde)
module.exports = router;
