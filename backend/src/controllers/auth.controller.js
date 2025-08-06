import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
  try {
    // ← Move destructuring inside try so catch() can trap malformed bodies
    const { fullName, email, password } = req.body || {};

    // 1) Validate inputs
    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: "All fields (fullName, email, password) are required",
      });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // 2) Check for existing user
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // 3) Hash & save
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const newUser = new User({ fullName, email, password: hashed });
    await newUser.save();

    // 4) Generate token _after_ save
    generateToken(newUser._id, res);

    // 5) Respond
    return res.status(201).json({
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      profilePic: newUser.profilePic,
    });
  } catch (error) {
    // ← Log the full error for stack trace
    console.error("Error in signup controller:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // 1) Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 2) Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 3) Issue JWT
    generateToken(user._id, res);

    // 4) Respond
    return res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.error("Error in login controller:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = (req, res) => {
  try {
    // clear the cookie
    res.cookie("jwt", "", { maxAge: 0 });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logout controller:", error);
    // still return success so front-end can clear state
    return res.status(200).json({ message: "Logged out successfully" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body || {};
    const userId = req.user && req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 1) Upload new pic
    const uploadResponse = await cloudinary.uploader.upload(profilePic);

    // 2) Update & return the updated user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    // ─── Critical bug fixed: responding with the correctly named variable
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error in updateProfile controller:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    return res.status(200).json(req.user);
  } catch (error) {
    console.error("Error in checkAuth controller:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
