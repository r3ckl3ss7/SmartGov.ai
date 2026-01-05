import User from "../models/user.model.js";
import asyncHandler from "express-async-handler";
import generateToken from "../utils/generateToken.js";

const registerUser = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    email,
    password,
    role: role || "auditor",
  });

  if (user) {
    const token = generateToken(user._id);

    res.status(201).json({
      _id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    res.status(401);
    throw new Error("Account is inactive");
  }

  const isPasswordValid = await user.comparePassword(password);

  if (isPasswordValid) {
    const token = generateToken(user._id);

    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      token,
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  res.json({ message: "User logged out successfully" });
});

export { registerUser, loginUser, logoutUser };
