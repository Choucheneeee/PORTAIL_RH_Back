const mongoose = require("mongoose");
const User = require("../models/User.model");
const bcrypt = require("bcryptjs");


console.log(process.env.MONGO_URI);
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI,);
    console.log("✅ MongoDB connecté !");
    await getSystemUser();

  } catch (error) {
    console.error("Erreur de connexion à MongoDB", error);
    process.exit(1);
  }
};

async function getSystemUser() {
  let systemUser = await User.findOne({ email: 'system@system.com' });
  if (!systemUser) {
    systemUser = new User({
      firstName: 'System',
      lastName: 'User',
      email: 'system@system.com',
      password: await bcrypt.hash('system_password', 10),
      role: 'admin',
      isVerified: true,
      isApproved: true
    });
    await systemUser.save();
  }
  return systemUser;
}

module.exports = connectDB;

