// Routes de gestion des demandes
const express = require("express");
const Request = require("../models/requests.model");
const router = express.Router();
const {
  createfiche,
  createattestation,
  createcertif,
  getAllRequests,
  getRequestById,
  updateRequest,
  deleteRequest,
  getCollaboratorRequests
} = require("../controllers/requestController");
const auth = require("../middleware/auth");

// Points de terminaison unifiés pour les demandes
router.post("/fiche", auth, createfiche);
router.post("/attestation", auth, createattestation);
router.post("/certif", auth, createcertif);

router.get("/", auth, getAllRequests);
router.get("/collaborator", auth, getCollaboratorRequests);
router.get("/:id", auth, getRequestById);
router.put("/:id", auth, updateRequest);
router.delete("/:id", auth, deleteRequest);

module.exports = router;