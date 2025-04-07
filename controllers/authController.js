const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// REGISTER 
exports.register = async (req, res) => {
  const { username, email, full_name, address, phone_number, password, confirm_password, role } = req.body;
  console.log("Received Registration Data:", req.body);

  // Validate required fields
  if (!username || !email || !full_name || !address || !phone_number || !password || !confirm_password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Ensure role is either "admin" or "user"
  if (role !== "admin" && role !== "user") {
    return res.status(400).json({ error: "Invalid role. Must be 'admin' or 'user'" });
  }

  // Validate password match
  if (password !== confirm_password) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  try {
    // Check if username or email already exists
    const [existingUser ] = await db.query("SELECT * FROM users WHERE username = ? OR email = ?", [username, email]);

    if (existingUser .length > 0) {
      return res.status(400).json({ error: "Username or email already in use" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user with role
    await db.query(
      "INSERT INTO users (username, email, full_name, address, phone_number, password, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [username, email, full_name, address, phone_number, hashedPassword, role]
    );

    res.status(201).json({ message: "User  registered successfully", role });
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
};

// LOGIN 
exports.login = async (req, res) => {
  const { username, password } = req.body;

  // Validate required fields
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    // Find user by username
    const [users] = await db.query("SELECT * FROM users WHERE username = ?", [username]);

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = users[0];

    // Compare password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Generate JWT token with role
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
        role: user.role
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
    const [users] = await db.query("SELECT id, username, email, full_name, address, phone_number, role FROM users");
    res.status(200).json(users);
  } catch (err) {
    console.error("Error retrieving users:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
};

/// DELETE USERS
exports.deleteUser  = async (req, res) => {
  const userId = req.params.id;
  console.log("Received DELETE request for user ID:", userId);

  try {
    const [result] = await db.query("DELETE FROM users WHERE id = ?", [userId]);

    if (result.affectedRows > 0) {
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
  const { username, email, full_name, address, phone_number, password, confirm_password, role } = req.body;

  // Validate required fields
  if (!username || !email || !full_name || !address || !phone_number || !role) {
    return res.status(400).json({ error: "All fields except password are required" });
  }

  // Validate role
  if (role !== "admin" && role !== "user") {
    return res.status(400).json({ error: "Invalid role. Must be 'admin' or 'user'" });
  }

  try {
    let hashedPassword = null;

    // Handle password update if provided
    if (password || confirm_password) {
      if (password !== confirm_password) {
        return res.status(400).json({ error: "Passwords do not match" });
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Prepare query & values
    const query = `
      UPDATE users 
      SET username = ?, email = ?, full_name = ?, address = ?, phone_number = ?, ${hashedPassword ? "password = ?, " : ""} role = ?
      WHERE id = ?
    `;

    const values = hashedPassword
      ? [username, email, full_name, address, phone_number, hashedPassword, role, userId]
      : [username, email, full_name, address, phone_number, role, userId];

    const [result] = await db.query(query, values);

    if (result.affectedRows > 0) {
      res.status(200).json({ message: "User updated successfully" });
    } else {
      res.status(404).json({ message: "User not found or no changes made" });
    }
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Database error", details: error.message });
  }
};


