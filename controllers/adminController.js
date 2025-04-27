const User = require("../models/User.model");




exports.allusers = async (req, res) => {
  try { 
    // Get only collaborateur users (verified and unverified)
    const verifiedUsers = await User.find({ 
      isVerified: true,
      role: "collaborateur"
    });
    const rh= await User.find({
      isVerified: true,
      role: "rh"
    });
    const admin= await User.find({  
        isVerified: true,
        role: "admin"
        });


    const unverifiedUsers = await User.find({ 
      isVerified: false, 
      role: "collaborateur" 
    });


    const output = {
      Numbercollaborators: verifiedUsers.length,
      collaborator: verifiedUsers,
      unverifiedUsers: unverifiedUsers,
      rh:rh,
      admin:admin
    };

    res.json(output);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching users");
  }
};

exports.updateruser = async (req, res) => {
    try{
        const userId=req.params.userId;
        const updatedUser = await User.findById(userId);
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        updatedUser.set(req.body);
        await updatedUser.save();
        res.status(200).json({ message: "User updated successfully", user: updatedUser });

    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
}
  exports.deleteuser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
    }