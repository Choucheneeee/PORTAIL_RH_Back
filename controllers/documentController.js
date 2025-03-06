// Document management

const path = require("path");
const { exec } = require("child_process");

exports.generateWorkCertificate = (req, res) => {
    try {
        const { employeeId } = req.params;

        if (!employeeId) {
            return res.status(400).json({ message: "Employee ID is required" });
        }

        // Correct path to the jasper template file (.jasper or .jrxml)
        const jasperTemplatePath = path.join(__dirname, "../jasperTemplates/work_certificate.jasper"); // Ensure it's a .jasper file
        const outputPath = path.join(__dirname, "../generated_reports", `certificate_${employeeId}.pdf`);

        // Ensure jasperstarter.jar path is correct
        const jasperStarterJarPath = "C:/jasperstarter/lib/jasperstarter.jar"; // Update path to the jar file if needed

        // Ensure that the command has the correct paths and parameters
        const command = `java -jar "${jasperStarterJarPath}" process "${jasperTemplatePath}" -o "${outputPath}" -f pdf -P EMPLOYEE_ID=${employeeId}`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error("JasperReports Error:", stderr);
                return res.status(500).json({ message: "Error generating report", error: stderr });
            }
            res.download(outputPath, (err) => {
                if (err) {
                    console.error("Error sending file:", err);
                    return res.status(500).json({ message: "Error downloading the report" });
                }
                console.log("Report generated and sent successfully");
            });
        });
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
