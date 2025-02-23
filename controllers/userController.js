const User = require("../models/User.model");

exports.getuser = async (req, res) => {
  const userId = req.user.id; 

  User.findById(userId)
    .then(user => {
      if (!user) {
        return res.status(404).send('User not found');
      }
      res.json(user);
    })
    .catch(() => {
      res.status(500).send('Error fetching user');
    });
};

const updateuser = async (req, res) => {
  try {
    const userId = req.user.id;  // Ensure that `authMiddleware` sets `req.user`

    // Convert the date fields in req.body to Date objects if they exist and are in the correct format
    if (req.body.personalInfo && req.body.personalInfo.birthDate) {
      // Convert 'dd/mm/yyyy' to 'yyyy-mm-dd' format before converting to a Date object
      req.body.personalInfo.birthDate = new Date(req.body.personalInfo.birthDate.split('/').reverse().join('-'));
    }
    if (req.body.professionalInfo && req.body.professionalInfo.hiringDate) {
      // Convert 'dd/mm/yyyy' to 'yyyy-mm-dd' format before converting to a Date object
      req.body.professionalInfo.hiringDate = new Date(req.body.professionalInfo.hiringDate.split('/').reverse().join('-'));
    }

    // Find the user by ID and update the fields
    const updatedUser = await User.findByIdAndUpdate(userId, req.body, { new: true });

    if (!updatedUser) {
      return res.status(404).send('User not found');
    }

    res.json("User updated successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating user');
  }
};

exports.updateuser = updateuser;


exports.allusers = async (req, res) => {
  try { 
    // Fetch verified and unverified users separately
    const verifiedUsers = await User.find({ isVerified: true });
    const unverifiedUsers = await User.find({ isVerified: false });

    const totalUsers = verifiedUsers.length;
    const adminCount = verifiedUsers.filter(user => user.role === "admin").length;
    const collaboratorCount = totalUsers - adminCount;

    const output = {
      "Totalusers": totalUsers,  // Only counts verified users
      "Numberadmins": adminCount,
      "Numbercollaborators": collaboratorCount,
      "admin": verifiedUsers.filter(user => user.role === "admin"),
      "collaborator": verifiedUsers.filter(user => user.role === "collaborateur"),
      "unverifiedUsers": unverifiedUsers // Include unverified users but don't count them
    };

    res.json(output);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching users");
  }
};

