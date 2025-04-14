const PdfPrinter = require('pdfmake');
const nodemailer = require('nodemailer');

const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

const printer = new PdfPrinter(fonts);
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const generateEmploymentCertificate = async (user, request) => {
  try {
    // Professional PDF Content
    const docDefinition = {
      header: {
        columns: [
          { text: 'OFFICIAL EMPLOYMENT CERTIFICATE', style: 'companyHeader' }
        ]
      },
      content: [
        { text: 'EMPLOYMENT VERIFICATION', style: 'documentTitle' },
        { text: '\n' },
        {
          text: [
            { text: 'Employee Name: ', bold: true },
            `${user.firstName || 'N/A'} ${user.lastName || 'N/A'}\n`,
            { text: 'Employee ID: ', bold: true },
            `${user.employeeId || 'N/A'}\n`,
            { text: 'Position Title: ', bold: true },
            `${user.professionalInfo?.position || 'N/A'}\n`,
            { text: 'Department: ', bold: true },
            `${user.professionalInfo?.department || 'N/A'}\n`,
            { text: 'Employment Start Date: ', bold: true },
            `${user.professionalInfo?.hiringDate?.toLocaleDateString() || 'N/A'}\n`,
            { text: 'Employment Status: ', bold: true },
            'Active'
          ],
          style: 'employeeDetails'
        },
        { text: '\n' },
        {
          text: [
            'This is to certify that ',
            { text: `${user.firstName} ${user.lastName} `, bold: true },
            'is a bona fide employee of ',
            { text: process.env.COMPANY_NAME, bold: true },
            '. This certificate is issued at the employee\'s request and is valid for official purposes only.'
          ],
          style: 'bodyText'
        },
        { text: '\n\n' },
        {
          columns: [
            { qr: `Employee ID: ${user.employeeId}`, fit: 100 },
            { 
              text: [
                { text: 'Authorized Signature:\n', bold: true },
                '[Digital Signature]\n',
                { text: `Date: ${new Date().toLocaleDateString()}`, italics: true }
              ], 
              alignment: 'right' 
            }
          ]
        }
      ],
      footer: function(currentPage, pageCount) {
        return {
          columns: [
            { text: `Confidential Document - ${process.env.COMPANY_NAME}`, alignment: 'left', fontSize: 8 },
            { text: `Page ${currentPage} of ${pageCount}`, alignment: 'right', fontSize: 8 }
          ],
          margin: [40, 20]
        };
      },
      styles: {
        documentTitle: {
          fontSize: 16,
          bold: true,
          alignment: 'center',
          margin: [0, 20, 0, 10]
        },
        companyHeader: {
          fontSize: 14,
          bold: true,
          color: '#2c3e50',
          margin: [20, 25, 0, 0]
        },
        employeeDetails: {
          fontSize: 12,
          lineHeight: 1.5,
          margin: [0, 10, 0, 10]
        },
        bodyText: {
          fontSize: 12,
          lineHeight: 1.5,
          margin: [0, 10, 0, 10]
        }
      },
      defaultStyle: {
        font: 'Roboto'
      }
    };

    // Generate PDF
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const pdfBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      pdfDoc.on('data', chunk => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });

    // Professional Email Template
    const mailOptions = {
      from: `"${process.env.COMPANY_NAME} HR Department" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Official Employment Certificate - ${user.firstName} ${user.lastName}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #2c3e50;">Employment Certificate Attached</h2>
          <p>Dear ${user.firstName},</p>
          <p>Please find attached your official employment certificate as requested.</p>
          <p><strong>Document Details:</strong></p>
          <ul>
            <li>Issued Date: ${new Date().toLocaleDateString()}</li>
            <li>Certificate Number: ${request._id.toString().slice(-8).toUpperCase()}</li>
          </ul>
          <p>This document contains sensitive information. Please handle it securely.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.9em; color: #666;">
            ${process.env.COMPANY_NAME}<br>
            ${process.env.COMPANY_ADDRESS}<br>
            Phone: ${process.env.COMPANY_PHONE}<br>
            Email: <a href="mailto:${process.env.HR_EMAIL}">${process.env.HR_EMAIL}</a>
          </p>
        </div>
      `,
      attachments: [{
        filename: `Employment-Certificate-${user.lastName}-${new Date().toISOString().split('T')[0]}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    };
    console.log("mail",mailOptions);
    await transporter.sendMail(mailOptions);

    return {
      documentData: {
        type: 'Employment Certificate',
        certificateNumber: request._id.toString().slice(-8).toUpperCase(),
        issuedDate: new Date(),
        recipient: user.email
      },
      emailSent: true
    };

  } catch (error) {
    console.error('Professional document generation failed:', error);
    throw error;
  }
};

module.exports = { generateEmploymentCertificate };