const Avance = require("../models/avance.model");
const nodemailer = require("nodemailer");
const User = require("../models/User.model");
const Notification = require('../models/notifications.model');
const Activite = require("../models/activite.model")



exports.createavance=async(req,res)=>{
     try{
            const {requestType,repaymentPeriod,reason,amount}=req.body
            const userId = req.user.id;
            if(!reason || !requestType) return res.status(400).json({ error: "avance type and motif are required." });
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
              }
            if(user?.financialInfo?.contractType!='Stage'){
                if(!user.financialInfo.RIB){
                  return res.status(400).json({ error: "Informations professionnelles ou financiere incomplètes" });
                }
              }
              if (!user.cin || !user.personalInfo.phone){
                return res.status(400).json({ error: "Informations  Personnel  ou  Social nanciere incomplètes" });
              }

            if(user?.financialInfo?.contractType!="CDI"){
              return res.status(400).json({
                  error: "Seul les employés en contrat CDI peuvent demander une avance."
              });
            }
            if(user?.financialInfo?.salary<amount/2){
              return res.status(400).json({
                  error: "Vous ne pouvez pas demander une avance supérieure à votre salaire/2"
              });
              
            }
            if(requestType==="pret" ){
              if(!repaymentPeriod) return res.status(400).json({ error: "repaymentPeriod is required." });
            }
            
            thismonth=new Date().getMonth()
            const exectingAvance= await Avance.find({
                user: userId,
                status: 'En attente',
                type:requestType,
              });
              if(exectingAvance.length>0) return res.status(400).json({ error: "Vous avez déjà une demande en attente pour ce type de remboursement" });

              const avances = await Avance.find({
                user: userId,
                type:requestType,
                status: 'Acceptée',
                createdAt: {
                  $gte: new Date(new Date().getFullYear(), thismonth, 1),
                  $lt: new Date(new Date().getFullYear(), thismonth + 1, 1)
                }
              })
              if(avances.length>0) return res.status(400).json({ error: "Vous avez déjà une demande pour ce mois" });
              
              const activite = new Activite({
                user:user.email,
                type:`Ajouter demande de avance/pret `,
                description:`${user.role} a ajouter un demande de ${requestType} `
              });
              await activite.save();
              const avanceData = {
                user: userId,
                type:requestType,
                remboursement:repaymentPeriod,
                motif:reason,
                firstName: user.firstName,
                lastName: user.lastName,
                montant:amount,
                status: 'En attente',
              };
            const newavance = new Avance(avanceData);
            await newavance.save();
    
            const rhs = await User.find({ role: "rh" });
                  if (rhs.length > 0) {
                    const rhsEmails = rhs.map(rh => rh.email);
              
                    await sendNotification(
                      rhsEmails,
                      user.firstName,
                      user.lastName,
                      userId, 
                      requestType,
                      user.email)
                        }
              
                  res.status(201).json({ message: "Demande de avance submitted successfully", data: newavance });
        }
        catch(error){
            res.status(500).json({ message: "Server error", error: error.message });
    
            }
    }
exports.getAvanceById=async(req,res)=>{
    try{
        const avanceId = req.params.id;
        const avance = await Avance.findById(avanceId);
        if (!avance) {
            return res.status(404).json({ message: "Avance not found" });
          }
          res.status(200).json(avance);
    }
    catch(error){
        res.status(500).json({ message: "Server error", error: error.message });

        }     
    }

exports.updateAvance = async (req, res) => {
    try {
        const avanceId = req.params.id;
        const { requestType, repaymentPeriod, reason, amount } = req.body;
        const userId = req.user.id;

        // Find the existing avance
        const existingAvance = await Avance.findById(avanceId);
        if (!existingAvance) {
            return res.status(404).json({ error: "Avance not found" });   
        }

        // Check if the avance belongs to the user
        if (existingAvance.user.toString() !== userId) {
            return res.status(403).json({ error: "Not authorized to update this avance" });
        }

        // Check if avance is already approved or rejected
        if (existingAvance.status !== 'En attente') {
            return res.status(400).json({ error: "Cannot update avance that is not in pending status" });
        }

        // Validate required fields
        if (!reason || !requestType) {
            return res.status(400).json({ error: "avance type and motif are required." });
        }

        // Find user and validate information
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Validate user information
        if (user?.financialInfo?.contractType !== 'Stage') {
            if (!user.financialInfo.RIB) {
                return res.status(400).json({ error: "Informations professionnelles ou financiere incomplètes" });
            }
        }

        if (!user.cin || !user.personalInfo.phone) {
            return res.status(400).json({ error: "Informations Personnel ou Social nanciere incomplètes" });
        }

        // Check contract type
        if (user?.financialInfo?.contractType !== "CDI") {
            return res.status(400).json({
                error: "Seul les employés en contrat CDI peuvent demander une avance."
            });
        }

        // Validate amount against salary
        if (user?.financialInfo?.salary < amount / 2) {
            return res.status(400).json({
                error: "Vous ne pouvez pas demander une avance supérieure à votre salaire/2"
            });
        }

        // Validate repayment period for loan type
        if (requestType === "pret" && !repaymentPeriod) {
            return res.status(400).json({ error: "repaymentPeriod is required." });
        }

        // Check for existing requests this month (excluding the current one being updated)
        const thisMonth = new Date().getMonth();
        const existingRequests = await Avance.find({
            user: userId,
            type: requestType,
            status: 'Acceptée',
            _id: { $ne: avanceId }, // Exclude current avance
            createdAt: {
                $gte: new Date(new Date().getFullYear(), thisMonth, 1),
                $lt: new Date(new Date().getFullYear(), thisMonth + 1, 1)
            }
        });

        if (existingRequests.length > 0) {
            return res.status(400).json({ error: "Vous avez déjà une demande pour ce mois" });
        }

        // Update avance
        const updatedAvance = await Avance.findByIdAndUpdate(
            avanceId,
            {
                type: requestType,
                remboursement: repaymentPeriod,
                motif: reason,
                montant: amount,
                status: 'En attente' // Reset status to pending after update
            },
            { new: true }
        );

        // Notify HR team about the update
        const rhs = await User.find({ role: "rh" });
        if (rhs.length > 0) {
            const rhsEmails = rhs.map(rh => rh.email);
            await sendNotification(
                rhsEmails,
                user.firstName,
                user.lastName,
                userId,
                requestType,
                user.email
            );
        }

        res.status(200).json({
            message: "Avance updated successfully",
            data: updatedAvance
        });

    } catch (error) {
        console.error("Avance update error:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};
    async function sendNotification(emails, firstName, lastName, id, type, email) { // Added 'io' as parameter
      try {
        const io = require('../server').io;
    
    
        const users = await User.find({ email: { $in: emails } });
        if (users.length === 0) {
          return;
        }
        
        const message = `📥 Nouvelle  avance ${type} de ${firstName} ${lastName}
    🗓 ${new Date().toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    })} ⏰ ${new Date().toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}
    📧 ${email} }`;
    
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
    
      } catch (error) {
        console.error('Error sending notifications:', error);
      }
    }
    

