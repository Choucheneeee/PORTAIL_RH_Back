import express from 'express';
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import cors from 'cors';
import dotenv from 'dotenv';

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
  console.log(process.env);
  console.log(missingEnvVars);
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
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

const systemMessage = {
  role: "system",
  content: `You are an AI assistant for an HR Portal application. You have knowledge about:
  - Employee management
  - Leave requests (congés)
  - Salary advance requests (avances)
  - Training programs (formations)
  - Document management
  - The platform's features for employees, HR managers, and administrators
  - Company policies and procedures
  
  Provide helpful, professional responses focused on HR-related queries and platform functionality.
  Développer un portail RH modulaire permettant une interaction
fluide entre collaborateurs et responsables RH, avec une interface sécurisée, des
notifications en temps réel et une gestion centralisée des données.
Public cible : Collaborateurs, Responsables RH, Administrateurs
  - Collaborateurs : Accès aux informations personnelles, demandes de congés, avances, formations et documents.
  - Responsables RH : Gestion des demandes, suivi des formations, gestion des documents et communication avec les collaborateurs.
  - Administrateurs : Gestion des utilisateurs, configuration du système et supervision des activités.
  
  Please respond in a professional and concise manner.
  Avoid unnecessary details and focus on the user's query.
  If the user asks for information about a specific document, provide a brief overview of the document's purpose and how to access it.
  If the user asks for information about a specific feature, provide a brief overview of the feature and how to use it.
  If the user asks for information about a specific policy, provide a brief overview of the policy and how it applies to the user.
  If the user asks for information about a specific procedure, provide a brief overview of the procedure and how to follow it.
  If the user asks for information about a specific training program, provide a brief overview of the program and how to enroll in it.
  If the user asks for information about a specific leave request, provide a brief overview of the request and how to submit it.
  If the user asks for information about a specific salary advance request, provide a brief overview of the request and how to submit it.
  If the user asks for information about a specific document management feature, provide a brief overview of the feature and how to use it.
  If the user asks for information about a specific employee management feature, provide a brief overview of the feature and how to use it.
  If the user asks for information about a specific leave management feature, provide a brief overview of the feature and how to use it.
  If the user asks for information about a specific salary advance management feature, provide a brief overview of the feature and how to use it.
  If the user asks for information about a specific training management feature, provide a brief overview of the feature and how to use it.
  respond always in french.
  If the user asks for information about a specific document management feature, provide a brief overview of the feature and how to use it.
  Descriptif du stage :
Mettre en place un portail RH qui permet d’organiser l’interactivité entre les collaborateurs et leur
hiérarchie.
Pour les collaborateurs :
- Créer un espace personnalisé avec un accès sécurisé ( spring security )
- Fiche signalétique (information personnelles, information professionnelles, information
sociales)
- Gestion des demandes (document, formation, congé, prêt et avance)
Pour les responsables RH :
- Accéder aux informations centralisées pour les différents collaborateurs
- Gestion de demandes des demandes
- Gestion des documents (attestation de travail, titre de congé .. Utilisant jasper report)
OnBoarding :
 Envoyer un mail automatique aux différents intervenants.
 Définir les étapes à suivre pour que le collaborateur crée son espace personnalisé.
 Gestion des notifications ( temps réel : websocket )
 Gestion des rôles (admin / collaborateur)
Tout ce projet sera basé sur des webservices, garantissant une architecture modulaire et une
intégration transparente avec les outils existants de l’entreprise. Cela permettra une gestion centralisée
et une interopérabilité optimale entre les différentes composantes du système
this is my model User:
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  cin:{
    type:Number,
    unique:true,
    require:true
  },
  email: { 
    type: String, 
    unique: true, 
    required: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  profileImage: { 
    type: String, 
  },
  isApproved: { 
    type: Boolean, 
    default: false 
  },
  verificationCode: String,
  role: { 
    type: String, 
    enum: ["admin", "collaborateur", "rh"], 
    required: true 
  },
  resetToken: String,
  resetTokenExpiration: Date,
  personalInfo: {
    phone: String,
    countryCode: String,
    address: String,
    birthDate: Date
  },
  financialInfo: {
    RIB: String,
    bankAccount: String,
    taxId: String,
    CNSS: String,
    paymentMethod: String,
    contractType: {
      type: String,
      enum: ['CDI', 'CDD'],
      default: 'CDI'
    },
    contractEndDate: {
      type: Date,
      validate: {
        validator: function(value) {
          if (this.financialInfo && this.financialInfo.contractType === 'CDD') {
            if (!value) return false;
            return value > this.professionalInfo?.hiringDate;
          }
          return true;
        },
        message: 'Contract end date must be provided and after hiring date for CDD contracts'
      }
    },
    transportAllowance: Number
  },
  professionalInfo: {
    position: String,
    department: String,
    hiringDate: Date,
    salary: Number,
    jobDescription: {
      responsibilities: [String],
      qualifications: [String],
      effectiveDate: Date
    }
  },
  socialInfo: {
    maritalStatus: String,
    children: Number
  },
  timeOffBalance: { 
    type: Number, 
    default: 28 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Add a pre-save middleware to clear contractEndDate if contract type is CDI
UserSchema.pre('save', function(next) {
  if (this.financialInfo && this.financialInfo.contractType === 'CDI') {
    this.financialInfo.contractEndDate = undefined;
  }
  next();
});

module.exports = mongoose.model("User", UserSchema);

model formation :const mongoose = require("mongoose");

const formationSchema = new mongoose.Schema({
  user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    titre:{
        type:String,
        require:true
    },
  type: {
    type: String,
    required: true,
    enum: [
      "internal",
      "external",
    ]
  },
  date_Debut:Date,
  date_Fin:String,
  description:String,
  organisme:String,
  cout:Number,
  status:String,
  firstName:String,
  lastName:String
},
 {
  timestamps: true
});


module.exports = mongoose.model("Formation", formationSchema);

model document:
const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
  type: {
    type: String,
    required: true,
    enum: [
      "attestation",
      "fiche_paie",
      "certificat",
    ]
  },
  firstName:String,
  lastName:String,
  periode:{
    type:String,
    enum:[
      "mensuel",
      "annuel"
    ]
  },
  mois:String,
  annee:String,
 documenttDetails:String,
  status:String
},
 {
  timestamps: true
});


module.exports = mongoose.model("Document", documentSchema);

model conge :
const mongoose = require("mongoose");

const congeSchema = new mongoose.Schema({
  user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },  
  type: {
    type: String,
    required: true,
    enum: [
      "annuel",
        "maladie",
        "sans_solde",
        "maternité",
        "paternité",

    ]
  },
  date_Debut:Date,
  date_Fin:String,
  motif:String,
  status:String,
  firstName:String,
  lastName:String
},
 {
  timestamps: true
});


module.exports = mongoose.model("Conge", congeSchema);

model avance:
const mongoose = require("mongoose");

const avanceSchema = new mongoose.Schema({
  user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
  type: {
    type: String,
    required: true,
    enum: [
      "pret",
      "avance",
    ]
  },
  remboursement :Number,
  motif:String,
montant:Number,
  status:String,
  firstName:String,
  lastName:String
},
 {
  timestamps: true
});


module.exports = mongoose.model("Avance", avanceSchema);
`
};

export const sendMessage = async (req, res) => {
  try {
    let { messages } = req.body;
    
    // Add system message if it's a new conversation
    if (!messages.some(msg => msg.role === 'system')) {
      messages = [systemMessage, ...messages];
    }

    const response = await client.path("/chat/completions").post({
      body: {
        messages: messages,
        temperature: 0.7, // Reduced for more focused responses
        top_p: 0.9,
        model: model,
        max_tokens: 1000
      }
    });

    if (isUnexpected(response)) {
      console.error("Unexpected response:", response);
      return res.status(500).json({ error: "Unexpected response from the API" }); 
    }

    // Clean and format the response
    
    res.json({ 
      response: response.body.choices[0].message.content
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred while processing your request" });
  }
};

