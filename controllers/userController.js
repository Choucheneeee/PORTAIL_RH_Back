const User = require("../models/User.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

exports.getuser = async (req, res) => {
  const userId = req.user.id; 

  User.findById(userId)
    .then(user => {
      if (!user) {
        return res.status(404).send('User not found');
      }
      res.json(user);
    })
    .catch(error => {
      res.status(500).send('Error fetching user');
    });
};

const updateuser = async (req, res) => {
  try {
    const userId = req.user.id;  // Ensure that `authMiddleware` sets `req.user`
    console.log(req.body);  // Logs the update data

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
