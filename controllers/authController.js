const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const User = require("../models/User");
require("dotenv").config();

// REGISTER
exports.register = async (req, res) => {
  const {
    username,
    email,
    full_name,
    address,
    phone_number,
    password,
    confirm_password,
    role,
  } = req.body;

  if (
    !username ||
    !email ||
    !full_name ||
    !address ||
    !phone_number ||
    !password ||
    !confirm_password ||
    !role
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!["admin", "user"].includes(role)) {
    return res
      .status(400)
      .json({ error: "Invalid role. Must be 'admin' or 'user'" });
  }

  if (password !== confirm_password) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  try {
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Username or email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username,
      email,
      full_name,
      address,
      phone_number,
      password: hashedPassword,
      role,
    });

    res.status(201).json({ message: "User registered successfully", role });
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res
        .status(401)
        .json({ error: "Invalid username or password" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res
        .status(401)
        .json({ error: "Invalid username or password" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        address: user.address,
        phone_number: user.phone_number,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
};

// GET ALL USERS
exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: [
        "id",
        "username",
        "email",
        "full_name",
        "address",
        "phone_number",
        "role",
      ],
    });
    res.status(200).json(users);
  } catch (err) {
    console.error("Error retrieving users:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
};

// DELETE USER
exports.deleteUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await User.destroy({ where: { id: userId } });

    if (result) {
      res.status(200).json({ message: "User deleted successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

// UPDATE USER
exports.updateUser = async (req, res) => {
  const userId = req.params.id;
  const { username, email, full_name, address, phone_number } = req.body;

  if (
    !username ||
    !email ||
    !full_name ||
    !address ||
    !phone_number
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const [updated] = await User.update(
      { username, email, full_name, address, phone_number },
      { where: { id: userId } }
    );

    if (updated) {
      res.status(200).json({ message: "User updated successfully" });
    } else {
      res
        .status(404)
        .json({ message: "User not found or no changes made" });
    }
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Database error", details: error.message });
  }
};
