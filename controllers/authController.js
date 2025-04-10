// User authentication logic

const User = require("../models/User.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require('crypto');

exports.registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      isVerified: false,
      isApproved: false, // All users need approval
      verificationCode,
    });

    await user.save();
    const name=firstName +" "+lastName
    await sendVerificationEmail(email, verificationCode,name);

    res.status(201).json({ message: "User registered. Check email for verification code." });
  } 
    catch (error) {
    // res.status(500).json({ message: "Server error", error: error.message });
  }
};


async function sendVerificationEmail(email, code,name) {
  console.log("name",name)

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
  });
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Email Verification",
    text: `Hey ${name}!

A sign in attempt requires further verification because we did not recognize your device. To complete the sign in, enter the verification code on the unrecognized device.

Verification code: ${code}

Thanks,
The Company Team`,
};

await transporter.sendMail(mailOptions);
return "User registered successfully. Please check your email for the verification code.";
}


exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.isVerified) return res.status(400).json({ message: "Email not verified" });


    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Email/password Incorrect" });

    if (!user.isApproved) return res.status(403).json({ message: "Approval pending. Contact an admin." });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({ 
      token: token, 
      userId: user._id,
      name: user.firstName,
      role: user.role,
    });  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found Make Sign Up First  " });
    if (user.isVerified) return res.status(400).json({ message: "Email already verified" });

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    user.isVerified = true;
    user.verificationCode = null;
    await user.save();

    res.status(200).json({ message: "Email verified successfully. Waiting for admin approval." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.approveUser = async (req, res) => {
  try {
    const { userId } = req.body;

    const admin = await User.findById(req.user.id);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Permission denied. Only admins can approve users." });
    }

    const userToApprove = await User.findById(userId);
    if (!userToApprove) {
      return res.status(404).json({ message: "User not found" });
    }

    userToApprove.isApproved = true;
    await userToApprove.save();

    res.status(200).json({ message: "User approved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



exports.forgotPassword =async (req, res) => {
  try {
    console.log("i get email")
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    console.log("email",email)

    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate reset token and expiry (e.g., 1 hour)
    const token = crypto.randomBytes(20).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification",
      text: `Hey ${user?.firstName} ${user?.lastName} !
      Please click on the following link to verify your email address:
      ${process.env.FRONTEND_URL}/reset-password?token=${token}
      Thanks,
      The Company Team`,
    };
    await transporter.sendMail(mailOptions);
    console.log("email sent")

    res.status(200).json({ message: 'Reset email sent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() }, // Check if token is valid
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
      user.password = await bcrypt.hash(newPassword, 12);
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.status(200).json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
