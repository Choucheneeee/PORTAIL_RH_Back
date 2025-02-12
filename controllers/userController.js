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

    // Find the user by ID and update the fields
    const updatedUser = await User.findByIdAndUpdate(userId, req.body, { new: true });

    if (!updatedUser) {
      return res.status(404).send('User not found');
    }

    // Return the updated user
    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating user');
  }
};

exports.updateuser = updateuser;
