const Formation = require("../models/formation.model");
const nodemailer = require("nodemailer");
const User = require("../models/User.model");
const Notification = require('../models/notifications.model');


exports.createformation = async(req, res) => {
    try {
        const {title, type, date_Debut, date_Fin, description, organisme, cout} = req.body;
        const userId = req.user.id;
        
        // Validation des champs obligatoires
        if (!title || !type) {
            return res.status(400).json({ error: "Le type et le titre de la formation sont obligatoires." });
        }
        
        if (!date_Debut || !date_Fin) {
            return res.status(400).json({ error: "Les dates de début et de fin sont obligatoires." });
        }
        
        // Validation des champs spécifiques au type "external"
        if (type === "external" && (!organisme || !cout || !description)) {
            return res.status(400).json({ 
                error: "Pour une formation externe, l'organisme, le coût et la description sont obligatoires." 
            });
        }
        
        // Récupération de l'utilisateur
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }
        if (!user.cin || user.personalInfo.phone){
          return res.status(400).json({ error: "Informations  Personnel  ou  Social nanciere incomplètes" });
        }
        if(user?.financialInfo?.contractType!='Stage'){
          if(!user.financialInfo.RIB){
            return res.status(400).json({ error: "Informations   ou financiere incomplètes" });
  
          }
        }
        
        // Validation des dates
        const hiringDate = user?.professionalInfo?.hiringDate;
        if (user?.financialInfo?.contractType !="CDI"){
          return res.status(400).json({
              error: "Seul les employés en contrat CDI peuvent demander une formation."
          });
        }

        if (!hiringDate) {
            return res.status(400).json({ 
                error: "La date d'embauche n'est pas définie. Impossible de créer une demande de formation." 
            });
        }
        
        const dateEmbauche = new Date(hiringDate);
        const dateDebut = new Date(date_Debut);
        const dateFin = new Date(date_Fin);
        const dateActuelle = new Date();
        
        // Vérification que la date de début est postérieure à la date d'embauche
        if (dateDebut < dateEmbauche) {
            return res.status(400).json({ 
                error: "La date de début de formation ne peut pas être antérieure à votre date d'embauche." 
            });
        }
        
        // Vérification que la date de début est postérieure à la date actuelle
        if (dateDebut < dateActuelle) {
            return res.status(400).json({ 
                error: "La date de début de formation ne peut pas être dans le passé." 
            });
        }
        
        // Vérification que la date de fin est postérieure à la date de début
        if (dateFin < dateDebut) {
            return res.status(400).json({ 
                error: "La date de fin doit être postérieure à la date de début." 
            });
        }
        
        // Vérification de la durée maximale de formation (par exemple, 30 jours)
        const dureeMax = 30 * 24 * 60 * 60 * 1000; // 30 jours en millisecondes
        if (dateFin - dateDebut > dureeMax) {
            return res.status(400).json({ 
                error: "La durée de la formation ne peut pas dépasser 30 jours." 
            });
        }
        
        // Création de l'objet formation
        const formationData = {
            user: userId,
            type: type,
            titre: title,
            date_Debut: dateDebut,
            date_Fin: dateFin,
            description: description,
            firstName: user.firstName,
            lastName: user.lastName,
            status: 'En attente',
            organisme: organisme,
            cout: cout
        };
        
        // Vérification si l'utilisateur a déjà une formation en attente ou approuvée qui chevauche les dates
        const formationsExistantes = await Formation.find({
            user: userId,
            status: { $in: ['en attente', 'approuvée'] },
            $or: [
                { 
                    date_Debut: { $lte: dateFin },
                    date_Fin: { $gte: dateDebut }
                }
            ]
        });
        
        if (formationsExistantes.length > 0) {
            return res.status(400).json({ 
                error: "Vous avez déjà une demande de formation qui chevauche ces dates." 
            });
        }
        
        // Sauvegarde de la formation
        const newFormation = new Formation(formationData);
        await newFormation.save();

        // Notification aux RH
        const rhs = await User.find({ role: "rh" });
        if (rhs.length > 0) {
            const rhsEmails = rhs.map(rh => rh.email);
            
            await sendNotification(
                rhsEmails,
                user.firstName,
                user.lastName,
                userId, 
                type,
                user.email
            );
        }
        
        res.status(201).json({ 
            message: "Demande de formation soumise avec succès", 
            data: newFormation 
        });
    }
    catch(error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
}


async function sendNotification(emails, firstName, lastName, id, type, email) {
  try {
    const io = require('../server').io;

    const users = await User.find({ email: { $in: emails } });
    if (users.length === 0) {
      console.log('No users found for notification');
      return;
    }
    
    const message = `📥 Nouvelle Formation ${type} de ${firstName} ${lastName}
🗓 ${new Date().toLocaleDateString('fr-FR', { 
  day: '2-digit', 
  month: 'short', 
  year: 'numeric' 
})} ⏰ ${new Date().toLocaleTimeString('fr-FR', { 
  hour: '2-digit', 
  minute: '2-digit' 
})}
📧 ${email}`;

    const notifications = users.map(user => ({
      sender: id,
      recipient: user._id,
      message: message
    }));

    await Notification.insertMany(notifications);

    users.forEach(user => {
      const userRoom = `user_${user._id}`;
      io.to(userRoom).emit('notif', { 
        type: 'new_request',
        message: message,
        timestamp: new Date().toISOString()
      });
    });

    console.log(`Notifications sent to ${users.length} users for new ${type} formation request`);
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}
