const express = require("express");
const Request = require("../models/requests.model");
const router = express.Router();
const {
  createRequest,
  getAllRequests,
  getRequestById,
  updateRequest,
  deleteRequest,
  getCollaboratorRequests
} = require("../controllers/requestController");
const auth = require("../middleware/auth");

// Unified Request Endpoints
router.post("/", auth, createRequest);
router.get("/", auth, getAllRequests);
router.get("/collaborator", auth, getCollaboratorRequests);
router.get("/:id", auth, getRequestById);
router.put("/:id", auth, updateRequest);
router.delete("/:id", auth, deleteRequest);

module.exports = router;