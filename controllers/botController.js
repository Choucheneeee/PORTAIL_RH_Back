const express = require('express');
const ModelClient = require("@azure-rest/ai-inference").default;
const { isUnexpected } = require("@azure-rest/ai-inference");
const { AzureKeyCredential } = require("@azure/core-auth");
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Validate environment variables
const requiredEnvVars = ['TOKEN', 'ENDPOINT', 'MODEL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  process.exit(1);
}

const token = process.env.TOKEN;
const endpoint = process.env.ENDPOINT;
const model = process.env.MODEL;


// Initialize the client
const client = ModelClient(
  endpoint,
  new AzureKeyCredential(token),
);

// Define the system prompt for HR context
const HR_SYSTEM_PROMPT = {
  role: "system",
  content: "You are an HR assistant specialized in human resources management and HR portal inquiries. Only respond to questions related to: 1) Employee management 2) Leave and absence management 3) Payroll and compensation 4) HR policies and procedures 5) Training and development 6) Recruitment and onboarding 7) Performance management 8) Employee benefits 9) HR documentation 10) HR portal usage. If a question is not related to HR or employee management, respond with: 'I can only assist with HR-related inquiries. Please ask a question about human resources management or the HR portal.'"
};

// Route for chat completions
const sendMessage = async (req, res) => {
  try {
    const { messages } = req.body;

    // Add the system prompt at the beginning of the conversation
    const messagesWithSystemPrompt = [HR_SYSTEM_PROMPT, ...messages];

    const response = await client.path("/chat/completions").post({
      body: {
        messages: messagesWithSystemPrompt,
        temperature: 0.7,
        top_p: 0.9,
        model: model
      }
    });

    if (isUnexpected(response)) {
      throw response.body.error;
    }

    res.json({
      response: response.body.choices[0].message.content
    });
  } catch (error) {
    res.status(500).json({ error: "An error occurred while processing your request" });
  }
};

module.exports = { sendMessage };

