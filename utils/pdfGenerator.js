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
    const docDefinition = {
      pageMargins: [40, 120, 40, 80],
      header: {
        columns: [
          { 
            image: 'logo.jpeg',
            width: 100,
            margin: [40, 20, 0, 0]
          },
          {
            stack: [
              { text: process.env.COMPANY_NAME, style: 'companyName' },
              { text: 'Certificate of Employment', style: 'companySubheader' },
              { text: process.env.COMPANY_ADDRESS, style: 'companyAddress' }
            ],
            margin: [20, 25, 0, 0]
          }
        ]
      },
      content: [
        { text: 'OFFICIAL EMPLOYMENT VERIFICATION', style: 'documentTitle' },
        { text: '\n' },
        {
          text: [
            { text: `${new Date().toLocaleDateString()}\n`, style: 'documentDate' },
            { text: 'To Whom It May Concern:\n\n', style: 'salutation' },
            
            `This is to certify that `,{text:`${user.firstName} ${user.lastName}`, bold: true}, ,
            `is duly employed with ${process.env.COMPANY_NAME} in the capacity of `,
            { text: `${user.professionalInfo?.position || 'their current position'}, `, bold: true },
            `assigned to the ${user.professionalInfo?.department || 'specified'} department.\n\n`,
            
            `Mr./Ms. ${user.lastName}  commenced employment with our organization on `,
            { text: `${user.professionalInfo?.hiringDate?.toLocaleDateString() || '[start date]'}, `, bold: true },
            `and has maintained an ${'Active'} employment status since that time. `,
            `This verification is issued upon the employee's formal request for official purposes.\n\n`,
            
            { text: 'Position Details:\n', style: 'sectionHeader' },
            `• Current Position: ${user.professionalInfo?.position || 'N/A'}\n`,
            `• Department: ${user.professionalInfo?.department || 'N/A'}\n`,
            `• Employment Type: Full-time Regular\n`,
            `• Reporting Structure: ${process.env.COMPANY_NAME} Organizational Hierarchy\n\n`,
            
            { text: 'Certification Statement:\n', style: 'sectionHeader' },
            `This document serves as official confirmation of employment status and may be used for `,
            `verification purposes with financial institutions, government agencies, or other entities `,
            `requiring proof of employment. The information contained herein is accurate as of the `,
            `date of issuance and remains valid unless otherwise superseded.\n\n`,
            
            { text: 'Authorization & Verification:\n', style: 'sectionHeader' },
            `This certificate bears the official digital signature of ${process.env.COMPANY_NAME} `,
            `and includes a unique QR code containing encrypted employment verification details.`
          ],
          style: 'mainContent'
        },
        { text: '\n' },
        {
          columns: [
            {
              text: [
                { text: 'Authorized Signature\n', style: 'signatureLabel' },
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1 }] },
                `${process.env.HR_MANAGER_NAME || 'HR Director'}\n`,
                `${process.env.COMPANY_NAME}`
              ],
              width: '*'
            },
          ],
          margin: [0, 20, 0, 0]
        }
      ],
      footer: {
        columns: [
          { 
            text: `CONFIDENTIAL DOCUMENT | ${process.env.COMPANY_PHONE} | ${process.env.HR_EMAIL}`, 
            fontSize: 8,
            color: '#666666'
          },
          { 
            text: `Valid through ${new Date().getFullYear()} | Page {{page}} of {{pages}}`, 
            fontSize: 8,
            alignment: 'right'
          }
        ],
        margin: [40, 20]
      },
      styles: {
        companyName: {
          fontSize: 16,
          bold: true,
          color: '#2c3e50'
        },
        companySubheader: {
          fontSize: 14,
          color: '#4a4a4a',
          margin: [0, 2, 0, 0]
        },
        companyAddress: {
          fontSize: 10,
          color: '#666666',
          margin: [0, 5, 0, 0]
        },
        documentTitle: {
          fontSize: 18,
          bold: true,
          color: '#1a237e',
          alignment: 'center',
          margin: [0, 10, 0, 15]
        },
        documentDate: {
          fontSize: 12,
          color: '#666666',
          alignment: 'right'
        },
        salutation: {
          fontSize: 12,
          color: '#333333',
          margin: [0, 0, 0, 10]
        },
        sectionHeader: {
          fontSize: 13,
          bold: true,
          color: '#1a237e',
          margin: [0, 10, 0, 5]
        },
        mainContent: {
          fontSize: 12,
          color: '#444444',
          lineHeight: 1.6,
          margin: [0, 0, 0, 10]
        },
        signatureLabel: {
          fontSize: 11,
          color: '#2c3e50',
          bold: true,
          margin: [0, 0, 0, 5]
        }
      },
      defaultStyle: {
        font: 'Roboto',
        lineHeight: 1.4
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
const generateJobDescriptionCertificate = async (user, request) => {
  try {
    const docDefinition = {
      pageMargins: [40, 140, 40, 80],
      header: {
        columns: [
          { 
            image: 'logo.jpeg',
            width: 100,
            margin: [40, 20, 0, 0]
          },
          { 
            stack: [
              { text: process.env.COMPANY_NAME, style: 'companyName' },
              { text: 'OFFICIAL JOB DESCRIPTION', style: 'companyHeader' }
            ],
            margin: [20, 25, 0, 0]
          }
        ]
      },
      content: [
        { text: 'POSITION DESCRIPTION DOCUMENT', style: 'documentTitle' },
        { text: '\n' },
        {
          stack: [
            // Employee Information Section
            {
              text: 'EMPLOYEE INFORMATION',
              style: 'sectionHeader',
              margin: [0, 0, 0, 10]
            },
            {
              text: [
                { text: 'Full Name: ', style: 'fieldLabel' },
                `${user.firstName} ${user.lastName}\n`,
                { text: 'Position Title: ', style: 'fieldLabel' },
                `${user.professionalInfo?.position || 'Not Specified'}\n`,
                { text: 'Department: ', style: 'fieldLabel' },
                `${user.professionalInfo?.department || 'Not Specified'}\n`,
                { text: 'Effective Date: ', style: 'fieldLabel' },
                `${user.professionalInfo?.jobDescription?.effectiveDate?.toLocaleDateString() || new Date().toLocaleDateString()}`
              ],
              style: 'fieldContent'
            },

            // Position Summary
            {
              text: 'POSITION SUMMARY',
              style: 'sectionHeader',
              margin: [0, 20, 0, 10]
            },
            {
              text: [
                `The ${user.professionalInfo?.position || 'this position'} role within `,
                { text: `${process.env.COMPANY_NAME}'s `, bold: true },
                `${user.professionalInfo?.department || 'specified department'} department `,
                `requires a professional with demonstrated expertise in their field. `,
                `This position entails the following key responsibilities and requirements:`
              ],
              style: 'paragraph'
            },

            // Key Responsibilities
            {
              text: 'KEY RESPONSIBILITIES',
              style: 'sectionHeader',
              margin: [0, 20, 0, 10]
            },
            {
              ul: (user.professionalInfo?.jobDescription?.responsibilities || ['Not specified'])
                .map(r => ({ text: r, style: 'listItem' })),
              style: 'listContainer'
            },

            // Required Qualifications
            {
              text: 'REQUIRED QUALIFICATIONS',
              style: 'sectionHeader',
              margin: [0, 20, 0, 10]
            },
            {
              ul: (user.professionalInfo?.jobDescription?.qualifications || ['Not specified'])
                .map(q => ({ text: q, style: 'listItem' })),
              style: 'listContainer'
            },

          ]
        }
      ],
      footer: {
        columns: [
          { 
            text: `CONFIDENTIAL DOCUMENT | ${process.env.COMPANY_ADDRESS} | ${process.env.COMPANY_PHONE}`, 
            fontSize: 8,
            color: '#666666',
            margin: [40, 20, 0, 0]
          },
          { 
            text: `Valid through ${new Date().getFullYear()} | Page 1 of 1`, 
            fontSize: 8,
            alignment: 'right',
            margin: [0, 20, 40, 0]
          }
        ]
      },
      styles: {
        companyName: {
          fontSize: 14,
          color: '#333333',
          bold: true,
          margin: [0, 0, 0, 2]
        },
        documentTitle: {
          fontSize: 20,
          bold: true,
          color: '#2c3e50',
          alignment: 'center',
          margin: [0, 0, 0, 15]
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          color: '#2c3e50',
          border: [false, false, false, true],
          borderColor: '#2c3e50',
          borderWidth: 1,
          padding: [0, 0, 5, 5]
        },
        fieldLabel: {
          bold: true,
          color: '#4a4a4a',
          fontSize: 12,
          margin: [0, 3, 0, 3]
        },
        fieldContent: {
          fontSize: 12,
          color: '#333333',
          lineHeight: 1.5,
          margin: [0, 0, 0, 15]
        },
        paragraph: {
          fontSize: 12,
          color: '#444444',
          lineHeight: 1.6,
          margin: [0, 0, 0, 15]
        },
        listContainer: {
          margin: [20, 5, 0, 15]
        },
        listItem: {
          fontSize: 12,
          color: '#444444',
          lineHeight: 1.5,
          markerColor: '#2c3e50'
        },
        signatureLabel: {
          bold: true,
          color: '#2c3e50',
          fontSize: 11,
          margin: [0, 0, 0, 5]
        }
      },
      defaultStyle: {
        font: 'Roboto',
        lineHeight: 1.4
      }
    };


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
      cc: process.env.HR_EMAIL,
      subject: `Official Job Description - ${user.firstName} ${user.lastName}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="border-bottom: 2px solid #2c3e50; padding-bottom: 15px; margin-bottom: 25px;">
            <img src="${process.env.COMPANY_LOGO_URL}" alt="Company Logo" style="max-height: 50px;">
          </div>
          <h2 style="color: #2c3e50; margin-bottom: 20px;">Job Description Document</h2>
          <p>Dear ${user.firstName},</p>
          <p>Please find attached your official job description document as requested.</p>
          
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Document Details:</strong></p>
            <ul style="margin: 10px 0 0 20px;">
              <li>Document Type: Position Description</li>
              <li>Effective Date: ${new Date().toLocaleDateString()}</li>
              <li>Reference Number: JD-${request._id.toString().slice(-8).toUpperCase()}</li>
            </ul>
          </div>

          <p style="color: #666; font-size: 0.9em;">
            <strong>Important:</strong> This document contains confidential employment information. 
            Please ensure proper handling and storage according to company policies.
          </p>

          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee;">
            <p style="font-size: 0.9em; color: #666; margin: 5px 0;">
              ${process.env.COMPANY_NAME}<br>
              ${process.env.COMPANY_ADDRESS}<br>
              HR Department: <a href="mailto:${process.env.HR_EMAIL}">${process.env.HR_EMAIL}</a>
            </p>
          </div>
        </div>
      `,
      attachments: [{
        filename: `Job-Description-${user.lastName}-${new Date().toISOString().split('T')[0]}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    };

    await transporter.sendMail(mailOptions);

    return {
      documentData: {
        type: 'Job Description',
        referenceNumber: `JD-${request._id.toString().slice(-8).toUpperCase()}`,
        effectiveDate: new Date(),
        recipient: user.email
      },
      emailSent: true
    };

  } catch (error) {
    console.error('Professional document generation failed:', error);
    throw error;
  }
};

const generateWorkTransferRequest = async (user, request) => {
  try {
    console.log("request",request);
    const docDefinition = {
      pageOrientation: 'portrait',
      pageMargins: [40, 120, 40, 60],
      header: {
        columns: [
          { 
            image: 'logo.jpeg', // Add actual logo buffer or remove
            width: 100,
            margin: [40, 20, 0, 0]
          },
          { 
            text: [
              { text: 'New Position: ', bold: true },
              `${request.details.newPosition || 'N/A'}\n\n`,
              { text: 'New Department: ', bold: true },
              `${request.details.newDepartment || 'N/A'}\n\n`,
              { text: 'Effective Date: ', bold: true },
              `${new Date(request.details.effectiveDate).toLocaleDateString() || 'N/A'}\n\n`,
              { text: 'Transfer Reason: ', bold: true },
              `${request.details.reason || 'Not specified'}`
            ],
            style: 'employeeDetails',
            margin: [20, 25, 0, 0]
          }
        ]
      },
      content: [
        { 
          text: 'EMPLOYEE WORK TRANSFER AUTHORIZATION', 
          style: 'documentTitle',
          margin: [0, 0, 0, 15]
        },
        {
          text: 'This document serves as official authorization for the permanent transfer of employment within the organization, outlining the terms and conditions governing this transition. The transfer is subject to organizational policies and any applicable collective bargaining agreements.',
          style: 'preambleText'
        },
        { text: '\n' },
        {
          style: 'sectionHeader',
          table: {
            widths: ['*'],
            body: [
              [{ text: '1. Employee Information', style: 'sectionHeaderText' }]
            ]
          }
        },
        {
          text: [
            { text: 'Employee Name: ', bold: true },
            `${user.firstName || 'N/A'} ${user.lastName || 'N/A'}\n`,

            { text: 'Current Position: ', bold: true },
            `${user.professionalInfo?.position || 'N/A'}\n`,
            { text: 'Years of Service: ', bold: true },
            `${calculateYearsOfService(user.professionalInfo.hiringDate)} years\n`,
          ],
          style: 'employeeDetails'
        },
        {
          style: 'sectionHeader',
          table: {
            widths: ['*'],
            body: [
              [{ text: '2. Transfer Details', style: 'sectionHeaderText' }]
            ]
          }
        },
        {
          text: [
            `Effective ${new Date(request.updatedAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}, `,
            { text: `${user.firstName} ${user.lastName} `, bold: true },
            `will be transferred from the current assignment in the `,
            { text: `${user.professionalInfo?.department || 'current department'}, `, bold: true },
            `to the new position within the `,
            { text: `${request.details.newDepartment || 'new department'}. `, bold: true },
            `This transfer constitutes a permanent reassignment of duties and responsibilities as outlined in the attached position description.`
          ],
          style: 'bodyText'
        },
        {
          text: [
            { text: '\nTransfer Rationale: ', bold: true, italics: true },
            `${request.details.reason || 'Organizational needs require workforce realignment to better serve operational requirements.'} `,
            `
            This transfer has been approved through proper organizational channels and complies with all relevant labor regulations.`
          ],
          style: 'bodyText'
        },
        {
          style: 'sectionHeader',
          table: {
            widths: ['*'],
            body: [
              [{ text: '3. Authorization & Acknowledgements', style: 'sectionHeaderText' }]
            ]
          }
        },
        {
          text: [
            'By signing below, all parties acknowledge understanding and acceptance of this transfer arrangement. The employee affirms commitment to a smooth transition, including proper handover of responsibilities and participation in any required orientation activities.\n\n',
            '__________________________________________\n',
            { text: 'Employee Signature', italics: true, fontSize: 10 }, '\n\n',
            '__________________________________________\n',
            { text: 'HR Representative Signature', italics: true, fontSize: 10 }, '\n\n',
            '__________________________________________\n',
            { text: 'Department Head Authorization', italics: true, fontSize: 10 }
          ],
          style: 'signatureBlock'
        },
        {
          text: '*This document becomes valid only when all required signatures are complete and verified by Human Resources.',
          style: 'disclaimerText'
        }
      ],
      footer: function(currentPage, pageCount) {
        return {
          columns: [
            { 
              text: `CONFIDENTIAL - ${process.env.COMPANY_NAME} INTERNAL USE ONLY`, 
              alignment: 'left', 
              fontSize: 8,
              color: '#666'
            },
            { 
              text: `Page ${currentPage} of ${pageCount} | Issued: ${new Date().toLocaleDateString()}`, 
              alignment: 'right', 
              fontSize: 8,
              color: '#666'
            }
          ],
          margin: [40, 20]
        };
      },
      styles: {
        documentTitle: {
          fontSize: 18,
          bold: true,
          alignment: 'center',
          color: '#1a365d',
          margin: [0, 10, 0, 5]
        },
        companyHeader: {
          fontSize: 16,
          bold: true,
          color: '#2c3e50'
        },
        documentSubHeader: {
          fontSize: 14,
          color: '#4a5568',
          margin: [0, 5, 0, 5]
        },
        departmentHeader: {
          fontSize: 12,
          color: '#718096',
          margin: [0, 0, 0, 10]
        },
        sectionHeader: {
          margin: [0, 15, 0, 10]
        },
        sectionHeaderText: {
          bold: true,
          fontSize: 13,
          color: '#ffffff',
          fillColor: '#2c3e50',
          margin: [10, 5, 10, 5]
        },
        employeeDetails: {
          fontSize: 12,
          lineHeight: 1.4,
          margin: [15, 10, 0, 15]
        },
        bodyText: {
          fontSize: 12,
          lineHeight: 1.4,
          margin: [15, 10, 0, 15],
          alignment: 'justify'
        },
        signatureBlock: {
          fontSize: 12,
          lineHeight: 1.8,
          margin: [15, 20, 0, 10]
        },
        disclaimerText: {
          italics: true,
          fontSize: 10,
          color: '#e53e3e',
          margin: [15, 20, 0, 0]
        },
        preambleText: {
          fontSize: 12,
          lineHeight: 1.4,
          alignment: 'justify',
          margin: [0, 0, 0, 15]
        }
      },
      defaultStyle: {
        font: 'Roboto'
      }
    };

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
        subject: `Official Work Transfer Certificate - ${user.firstName} ${user.lastName}`,
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
    console.error('Work transfer document generation failed:', error);
    throw error;
  }
};

const generatePayslipRequest = async (user, request) => {
  try {
    console.log("request",request);
    const docDefinition = {
      pageOrientation: 'portrait',
      pageMargins: [40, 120, 40, 60],
      header: {
        columns: [
          { 
            image: 'logo.jpeg',
            width: 100,
            margin: [40, 20, 0, 0]
          },
          { 
            text: [
              { text: 'PAYSLIP\n', style: 'headerTitle' },
              { 
                text: [
                  { text: 'Payment Period: ', bold: true },
                  `${new Date(request.paydetails.periodStart).toLocaleDateString()} - `,
                  `${new Date(request.paydetails.periodEnd).toLocaleDateString()}\n`,
                  { text: 'Issued: ', bold: true },
                  new Date().toLocaleDateString()
                ],
                style: 'headerDetails'
              }
            ],
            margin: [20, 25, 0, 0]
          }
        ]
      },
      content: [
        { text: 'EMPLOYEE PAYSLIP', style: 'documentTitle' },
        { text: '\n' },
    
        // Employee Information Section
        {
          text: [
            { text: 'Employee Information\n', style: 'sectionTitle' },
            { text: 'Name: ', bold: true }, 
            `${user.firstName} ${user.lastName}\n`,
            { text: 'Position: ', bold: true }, 
            `${user.professionalInfo?.position || 'N/A'}\n\n`,
            
            { text: 'Bank Details\n', style: 'subsectionHeader' },
            { text: 'Account Number: ', bold: true }, 
            `${user.financialInfo?.bankAccount || 'N/A'}\n`,
            { text: 'Tax Identification: ', bold: true }, 
            `${user.financialInfo?.taxId || 'N/A'}\n`
          ],
          style: 'employeeInfo'
        },
        { text: '\n' },
    
        // Compensation Breakdown
        {
          text: [
            { text: 'Compensation Breakdown\n', style: 'sectionTitle' },
            
            { text: 'Earnings\n', style: 'subsectionHeader' },
            `• Base Salary: ${formatCurrency(request.paydetails.basicSalary)}\n`,
            `• Allowances: ${formatCurrency(request.paydetails.allowances)}\n`,
            `• Overtime: ${formatCurrency(request.paydetails.overtime)}\n`,
            { 
              text: `Total Earnings: ${formatCurrency(request.paydetails.totalEarnings)}\n\n`,
              style: 'totalAmount'
            },
            
            { text: 'Deductions\n', style: 'subsectionHeader' },
            `• Tax Withheld: ${formatCurrency(request.paydetails.tax)}\n`,
            `• Insurance Premiums: ${formatCurrency(request.paydetails.insurance)}\n`,
            `• Other Deductions: ${formatCurrency(request.paydetails.otherDeductions)}\n`,
            { 
              text: `Total Deductions: ${formatCurrency(request.paydetails.totalDeductions)}\n\n`,
              style: 'totalAmount'
            },
            
            { text: 'Net Payable Amount\n', style: 'subsectionHeader' },
            { 
              text: formatCurrency(request.paydetails.netPay),
              style: 'netPay'
            }
          ],
          style: 'compensationDetails'
        },
        { text: '\n' },
    
        // Footer
        {
          text: [
            { text: 'Important Notes:\n', style: 'footerHeader' },
            { 
              text: `• This is an electronically generated document requiring no signature\n`,
              italics: true
            },
            { 
              text: `• Valid only when verified through ${process.env.COMPANY_NAME} HR system\n`,
              italics: true
            },
            { 
              text: `• Issued on ${new Date().toLocaleDateString()}`,
              italics: true
            }
          ],
          style: 'footerText'
        }
      ],
      styles: {
        headerTitle: {
          fontSize: 18,
          bold: true,
          color: '#2c3e50'
        },
        headerDetails: {
          fontSize: 10,
          color: '#666',
          lineHeight: 1.3
        },
        documentTitle: {
          fontSize: 16,
          bold: true,
          color: '#1a365d',
          alignment: 'center',
          margin: [0, 0, 0, 10]
        },
        sectionTitle: {
          fontSize: 14,
          bold: true,
          color: '#ffffff',
          background: '#2c3e50',
          margin: [0, 5, 0, 10],
          padding: [8, 5],
          borderRadius: 3
        },
        employeeInfo: {
          fontSize: 12,
          lineHeight: 1.6,
          margin: [0, 0, 0, 15]
        },
        subsectionHeader: {
          fontSize: 12,
          bold: true,
          color: '#2c3e50',
          margin: [0, 10, 0, 5]
        },
        totalAmount: {
          bold: true,
          color: '#1a365d'
        },
        netPay: {
          fontSize: 16,
          bold: true,
          color: '#1a365d',
          background: '#f0f4f8',
          padding: [8, 5],
          borderRadius: 3
        },
        footerText: {
          fontSize: 10,
          color: '#666',
          lineHeight: 1.4
        },
        footerHeader: {
          bold: true,
          color: '#2c3e50',
          margin: [0, 0, 0, 5]
        }
      },
      defaultStyle: {
        font: 'Roboto',
        fontSize: 12,
        lineHeight: 1.4
      }
    };

    // PDF generation and email code similar to work transfer function
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const pdfBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      pdfDoc.on('data', chunk => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });

    const mailOptions = {
      from: `"${process.env.COMPANY_NAME} Payroll Department" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Payslip - ${new Date(request.paydetails.periodStart).toLocaleDateString()} to ${new Date(request.paydetails.periodEnd).toLocaleDateString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #2c3e50;">Payslip Attached</h2>
          <p>Dear ${user.firstName},</p>
          <p>Please find attached your payslip for the period ${new Date(request.paydetails.periodStart).toLocaleDateString()} - ${new Date(request.paydetails.periodEnd).toLocaleDateString()}.</p>
          <p><strong>Payment Summary:</strong></p>
          <ul>
            <li>Net Pay: ${formatCurrency(request.paydetails.netPay)}</li>
            <li>Payment Date: ${new Date().toLocaleDateString()}</li>
          </ul>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.9em; color: #666;">
            ${process.env.COMPANY_NAME}<br>
            ${process.env.COMPANY_ADDRESS}<br>
            Payroll Department: <a href="mailto:${process.env.PAYROLL_EMAIL}">${process.env.PAYROLL_EMAIL}</a>
          </p>
        </div>
      `,
      attachments: [{
        filename: `Payslip-${user.lastName}-${new Date().toISOString().split('T')[0]}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    };

    await transporter.sendMail(mailOptions);

    return {
      documentData: {
        type: 'Payslip',
        periodStart: request.paydetails.periodStart,
        periodEnd: request.paydetails.periodEnd,
        netPay: request.paydetails.netPay,
        recipient: user.email
      },
      emailSent: true
    };

  } catch (error) {
    console.error('Payslip generation failed:', error);
    throw error;
  }
};

// Helper function
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(amount);
};
function calculateYearsOfService(hireDate) {
  const diff = new Date() - new Date(hireDate);
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
}

const generateSalaryCertificate = async (user, request) => {
  try {
    const docDefinition = {
      pageOrientation: 'portrait',
      pageMargins: [40, 120, 40, 60],
      header: {
        columns: [
          { 
            image: 'logo.jpeg',
            width: 100,
            margin: [40, 20, 0, 0]
          },
          { 
            text: [
              { text: 'SALARY CERTIFICATE\n', style: 'headerTitle' },
              { 
                text: [
                  { text: 'Certificate Number: ', bold: true },
                  `${request._id.toString().slice(-8).toUpperCase()}\n`,
                  { text: 'Issued Date: ', bold: true },
                  new Date().toLocaleDateString()
                ],
                style: 'headerDetails'
              }
            ],
            margin: [20, 25, 0, 0]
          }
        ]
      },
      content: [
        { text: 'OFFICIAL SALARY CERTIFICATE', style: 'documentTitle' },
        { text: '\n' },

        // Employee Information
        {
          text: [
            { text: 'This is to certify that:\n\n', style: 'certificateIntro' },
            { text: 'Employee Name: ', bold: true }, 
            `${user.firstName} ${user.lastName}\n`,
            { text: 'Position: ', bold: true }, 
            `${user.professionalInfo?.position || 'N/A'}\n`,
            { text: 'Department: ', bold: true }, 
            `${user.professionalInfo?.department || 'N/A'}\n`,
            { text: 'Date of Joining: ', bold: true }, 
            `${new Date(user.professionalInfo?.hiringDate).toLocaleDateString() || 'N/A'}\n\n`
          ],
          style: 'employeeInfo'
        },

        // Salary Details
        {
          text: [
            { text: 'Current Salary Structure\n', style: 'sectionTitle' },
            `As of ${new Date().toLocaleDateString()}, the monthly salary details are as follows:\n\n`,
            { text: 'Basic Salary: ', bold: true }, 
            `${formatCurrency(request.paydetails.basicSalary)}\n`,
            { text: 'Allowances: ', bold: true }, 
            `${formatCurrency(request.paydetails.allowances)}\n`,
            { text: 'Fixed Deductions: ', bold: true }, 
            `${formatCurrency(request.paydetails.totalDeductions)}\n\n`,
            { text: 'Net Monthly Salary: ', bold: true }, 
            { 
              text: `${formatCurrency(request.paydetails.netPay)}\n`,
              style: 'netSalary'
            }
          ],
          style: 'salaryDetails'
        },
        { text: '\n' },

        // Official Declaration
        {
          text: [
            { text: 'Declaration\n', style: 'sectionTitle' },
            `This certificate is issued at the request of the employee for official purposes. 
            The information provided herein is true and accurate to the best of our records 
            as of the date of issuance.\n\n`,
            { text: 'Authorized Signatory\n', style: 'signatoryLabel' },
            { text: `${process.env.COMPANY_NAME}\n`, style: 'companyName' },
            { text: 'Human Resources Department\n', style: 'departmentName' }
          ],
          style: 'declarationText'
        },

        // Footer
        {
          text: [
            { text: '\n' },
            { text: process.env.COMPANY_ADDRESS, style: 'footerText' },
            { text: `Contact: ${process.env.HR_EMAIL} | ${process.env.COMPANY_PHONE}`, style: 'footerContact' },
            { text: 'This document is electronically verified and requires no physical signature', style: 'footerNote' }
          ],
          alignment: 'center'
        }
      ],
      styles: {
        headerTitle: {
          fontSize: 18,
          bold: true,
          color: '#1a365d'
        },
        headerDetails: {
          fontSize: 10,
          color: '#666',
          lineHeight: 1.3
        },
        documentTitle: {
          fontSize: 16,
          bold: true,
          color: '#2c3e50',
          alignment: 'center',
          margin: [0, 0, 0, 10]
        },
        certificateIntro: {
          fontSize: 12,
          italic: true,
          margin: [0, 0, 0, 10]
        },
        employeeInfo: {
          fontSize: 12,
          lineHeight: 1.6,
          margin: [0, 0, 0, 15]
        },
        sectionTitle: {
          fontSize: 14,
          bold: true,
          color: '#ffffff',
          background: '#2c3e50',
          margin: [0, 5, 0, 10],
          padding: [8, 5],
          borderRadius: 3
        },
        salaryDetails: {
          fontSize: 12,
          lineHeight: 1.5,
          margin: [0, 0, 0, 15]
        },
        netSalary: {
          bold: true,
          color: '#1a365d',
          fontSize: 14
        },
        declarationText: {
          fontSize: 12,
          lineHeight: 1.4
        },
        signatoryLabel: {
          bold: true,
          margin: [0, 15, 0, 5]
        },
        companyName: {
          fontSize: 12,
          bold: true,
          color: '#2c3e50'
        },
        departmentName: {
          fontSize: 11,
          color: '#666'
        },
        footerText: {
          fontSize: 10,
          color: '#666'
        },
        footerContact: {
          fontSize: 10,
          color: '#1a365d'
        },
        footerNote: {
          fontSize: 9,
          italic: true,
          color: '#999'
        }
      },
      defaultStyle: {
        font: 'Roboto',
        fontSize: 12,
        lineHeight: 1.4
      }
    };

    // PDF Generation
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const pdfBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      pdfDoc.on('data', chunk => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });

    // Email Configuration
    const mailOptions = {
      from: `"${process.env.COMPANY_NAME} HR Department" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Salary Certificate - ${user.firstName} ${user.lastName}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #2c3e50;">Official Salary Certificate Attached</h2>
          <p>Dear ${user.firstName},</p>
          <p>Please find attached your official salary certificate as requested.</p>
          <p><strong>Document Details:</strong></p>
          <ul>
            <li>Certificate Number: ${request._id.toString().slice(-8).toUpperCase()}</li>
            <li>Issued Date: ${new Date().toLocaleDateString()}</li>
          </ul>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.9em; color: #666;">
            ${process.env.COMPANY_NAME}<br>
            ${process.env.COMPANY_ADDRESS}<br>
            HR Contact: <a href="mailto:${process.env.HR_EMAIL}">${process.env.HR_EMAIL}</a>
          </p>
        </div>
      `,
      attachments: [{
        filename: `Salary-Certificate-${user.lastName}-${new Date().toISOString().split('T')[0]}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    };

    await transporter.sendMail(mailOptions);

    return {
      documentData: {
        type: 'Salary Certificate',
        certificateNumber: request._id.toString().slice(-8).toUpperCase(),
        issuedDate: new Date(),
        recipient: user.email
      },
      emailSent: true
    };

  } catch (error) {
    console.error('Salary certificate generation failed:', error);
    throw error;
  }
};
const generateTaxCertificate = async (user, request) => {
  console.log("request",request);
  try {
    const docDefinition = {
      pageOrientation: 'portrait',
      pageMargins: [40, 120, 40, 60],
      header: {
        columns: [
          { 
            image: 'logo.jpeg',
            width: 100,
            margin: [40, 20, 0, 0]
          },
          { 
            text: [
              { text: 'TAX CERTIFICATE\n', style: 'headerTitle' },
              { 
                text: [
                  { text: 'Fiscal Year: ', bold: true },
                  `${new Date(request.paydetails.periodStart).getFullYear()}\n`,
                  { text: 'Certificate ID: ', bold: true },
                  `TX-${request._id.toString().slice(-8).toUpperCase()}`
                ],
                style: 'headerDetails'
              }
            ],
            margin: [20, 25, 0, 0]
          }
        ]
      },
      content: [
        { text: 'OFFICIAL TAX CERTIFICATE', style: 'documentTitle' },
        { text: '\n' },

        // Employee Information
        {
          text: [
            { text: 'This is to certify that:\n\n', style: 'certificateIntro' },
            { text: 'Name: ', bold: true }, 
            `${user.firstName} ${user.lastName}\n`,
            { text: 'Tax Identification Number: ', bold: true }, 
            `${user.financialInfo?.taxId || 'N/A'}\n`,
            
            { text: 'Position: ', bold: true }, 
            `${user.professionalInfo?.position || 'N/A'}\n`,
            { text: 'Date of Employment: ', bold: true }, 
            `${new Date(user.professionalInfo?.hiringDate).toLocaleDateString() || 'N/A'}\n\n`
          ],
          style: 'employeeInfo'
        },

        // Tax Details
        {
          text: [
            { text: 'Tax Information\n', style: 'sectionTitle' },
            { text: '\n' },
            `For the fiscal year ${new Date(request.paydetails.periodStart).getFullYear()}, the following tax details are certified:\n\n`,
            
            { text: 'Total Annual Income: ', bold: true }, 
            `${formatCurrency(request.paydetails.totalEarnings * 12)}\n`,
            { text: 'Taxes Withheld: ', bold: true }, 
            `${formatCurrency(request.paydetails.tax * 12)}\n`,
            { text: 'Allowable Deductions: ', bold: true }, 
            `${formatCurrency(request.paydetails.totalDeductions * 12)}\n\n`,
            
            { text: 'Net Taxable Income: ', bold: true }, 
            { 
              text: `${formatCurrency((request.paydetails.totalEarnings - request.paydetails.totalDeductions) * 12)}\n`,
              style: 'netTaxable'
            }
          ],
          style: 'taxDetails'
        },
        { text: '\n' },

        
        {
          stack: [
            { text: 'Income Breakdown', style: 'sectionTitle' },
            {
              ul: [
                `Basic Salary: ${formatCurrency(request.paydetails.basicSalary)}/month`,
                `Allowances: ${formatCurrency(request.paydetails.allowances)}/month`,
                `Overtime: ${formatCurrency(request.paydetails.overtime)}/month`
              ],
              style: 'breakdownList'
            }
          ],
          margin: [0, 0, 0, 10]
        },
        
        // Deduction Details
        {
          stack: [
            { text: 'Tax Deductions', style: 'sectionTitle' },
            {
              ul: [
                `Income Tax: ${formatCurrency(request.paydetails.tax)}/month`,
                `Social Security: ${formatCurrency(request.paydetails.insurance)}/month`,
                `Other Deductions: ${formatCurrency(request.paydetails.otherDeductions)}/month`
              ],
              style: 'deductionList'
            }
          ],
          margin: [0, 0, 0, 10]
        },
        { text: '\n' },

        // Official Declaration
        {
          text: [
            { text: 'Legal Declaration\n', style: 'sectionTitle' },
            { text: '\n' },
            `This document serves as official verification of tax information for ${new Date().getFullYear()} fiscal year.\n\n`,
            `• Issued in accordance with national tax regulations\n`,
            `• Valid for submission to tax authorities\n`,
            `• Subject to audit verification\n\n`,
            { text: 'Authorized Signatory\n', style: 'signatoryLabel' },
            { text: `${process.env.COMPANY_NAME}\n`, style: 'companyName' },
            { text: 'Finance Department\n', style: 'departmentName' }
          ],
          style: 'declarationText'
        },

        // Footer
        {
          text: [
            { text: '\n' },
            { text: process.env.COMPANY_ADDRESS, style: 'footerText' },
            { text: `Tax Office Registration: ${process.env.TAX_REG_NUMBER}`, style: 'footerLegal' },
            { text: 'This document contains sensitive financial information - Handle with confidentiality', style: 'footerWarning' }
          ],
          alignment: 'center'
        }
      ],
      styles: {
        headerTitle: {
          fontSize: 18,
          bold: true,
          color: '#1a365d'
        },
        headerDetails: {
          fontSize: 10,
          color: '#666',
          lineHeight: 1.3
        },
        documentTitle: {
          fontSize: 16,
          bold: true,
          color: '#2c3e50',
          alignment: 'center',
          margin: [0, 0, 0, 10]
        },
        certificateIntro: {
          fontSize: 12,
          italic: true,
          margin: [0, 0, 0, 10]
        },
        employeeInfo: {
          fontSize: 12,
          lineHeight: 1.6,
          margin: [0, 0, 0, 15]
        },
        sectionTitle: {
          fontSize: 14,
          bold: true,
          color: '#ffffff',
          background: '#2c3e50',
          margin: [0, 5, 0, 10],
          padding: [8, 5],
          borderRadius: 3
        },
        taxDetails: {
          fontSize: 12,
          lineHeight: 1.5,
          margin: [0, 0, 0, 15]
        },
        netTaxable: {
          bold: true,
          color: '#1a365d',
          fontSize: 14,
          background: '#f0f4f8',
          padding: [5, 3],
          borderRadius: 2
        },
        breakdownList: {
          fontSize: 12,
          lineHeight: 1.4
        },
        deductionList: {
          fontSize: 12,
          lineHeight: 1.4
        },
        declarationText: {
          fontSize: 12,
          lineHeight: 1.4
        },
        signatoryLabel: {
          bold: true,
          margin: [0, 15, 0, 5]
        },
        companyName: {
          fontSize: 12,
          bold: true,
          color: '#2c3e50'
        },
        departmentName: {
          fontSize: 11,
          color: '#666'
        },
        footerText: {
          fontSize: 10,
          color: '#666'
        },
        footerLegal: {
          fontSize: 10,
          color: '#1a365d'
        },
        footerWarning: {
          fontSize: 9,
          color: '#e53e3e',
          bold: true
        }
      },
      defaultStyle: {
        font: 'Roboto',
        fontSize: 12,
        lineHeight: 1.4
      },
    };

    // PDF Generation
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const pdfBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      pdfDoc.on('data', chunk => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });

    // Email Configuration
    const mailOptions = {
      from: `"${process.env.COMPANY_NAME} Finance Department" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Tax Certificate - FY ${new Date(request.paydetails.periodStart).getFullYear()}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #2c3e50;">Official Tax Certificate Attached</h2>
          <p>Dear ${user.firstName},</p>
          <p>Please find attached your tax certificate for fiscal year ${new Date(request.paydetails.periodStart).getFullYear()}.</p>
          <p><strong>Document Details:</strong></p>
          <ul>
            <li>Certificate ID: TX-${request._id.toString().slice(-8).toUpperCase()}</li>
            <li>Issued Date: ${new Date().toLocaleDateString()}</li>
            <li>Tax Year: ${new Date(request.paydetails.periodStart).getFullYear()}</li>
          </ul>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.9em; color: #666;">
            ${process.env.COMPANY_NAME}<br>
            ${process.env.COMPANY_ADDRESS}<br>
            Tax Office Registration: ${process.env.TAX_REG_NUMBER}
          </p>
        </div>
      `,
      attachments: [{
        filename: `Tax-Certificate-${user.lastName}-FY${new Date(request.paydetails.periodStart).getFullYear()}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    };

    await transporter.sendMail(mailOptions);

    return {
      documentData: {
        type: 'Tax Certificate',
        certificateId: `TX-${request._id.toString().slice(-8).toUpperCase()}`,
        fiscalYear: new Date(request.paydetails.periodStart).getFullYear(),
        issuedDate: new Date(),
        recipient: user.email
      },
      emailSent: true
    };

  } catch (error) {
    console.error('Tax certificate generation failed:', error);
    throw error;
  }
};
module.exports = { generateEmploymentCertificate,generateJobDescriptionCertificate,generateWorkTransferRequest,generatePayslipRequest,generateSalaryCertificate,generateTaxCertificate };