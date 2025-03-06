

const express = require("express");
const { generateWorkCertificate } = require("../controllers/documentController");
const router = express.Router();

router.get("/generate-certificate/:employeeId", generateWorkCertificate);

module.exports = router;
