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
