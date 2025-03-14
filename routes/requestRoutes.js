const express = require("express");
const Request = require("../models/requests.model");
const router = express.Router();
const { addRequest,getAllRequest,updatedRequest,deleteRequest,getOneRequest,getAllRequestCollab }=require("../controllers/requestController");
const authMiddleware = require("../middleware/auth");


// 📌 Create a new request
router.post("/addRequest",authMiddleware,addRequest);

router.get("/",authMiddleware,getAllRequest )
router.get("/:id",authMiddleware,getOneRequest)


router.get("/getreqCollab/:id",authMiddleware,getAllRequestCollab )

// 📌 Get a specific request by ID
router.put("/update/:id",authMiddleware,updatedRequest )


// 📌 Delete a request
router.delete("/deletereq/:id",authMiddleware,deleteRequest )

module.exports = router;
