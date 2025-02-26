const express = require("express");
const Request = require("../models/requests.model");
const router = express.Router();
const { addRequest,getAllRequest }=require("../controllers/requestController");
const authMiddleware = require("../middleware/auth");


// 📌 Create a new request
router.post("/addRequest",authMiddleware,addRequest);

router.get("/",authMiddleware,getAllRequest )

// 📌 Get a specific request by ID
router.get("/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate("user").populate("document");
    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Update request status (Approve/Reject)
router.put("/:id/status", async (req, res) => {
  try {
    const { status, documentId } = req.body;
    if (!["en attente", "validé", "rejeté"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updateData = { status, updatedAt: new Date() };
    if (documentId) updateData.document = documentId;

    const updatedRequest = await Request.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedRequest) return res.status(404).json({ message: "Request not found" });

    res.json({ message: "Request updated successfully", data: updatedRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Delete a request
router.delete("/:id", async (req, res) => {
  try {
    const deletedRequest = await Request.findByIdAndDelete(req.params.id);
    if (!deletedRequest) return res.status(404).json({ message: "Request not found" });
    res.json({ message: "Request deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
