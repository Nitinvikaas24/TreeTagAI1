import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import docClient from "../config/db.js"; // <--- UPDATED IMPORT

const TABLE_NAME = "Userdb-dev";

// --- SIGNUP ---
export const signup = async (req, res) => {
  try {
    const { phoneNumber, pin, name } = req.body;

    if (!phoneNumber || !pin || pin.length !== 4) {
      return res.status(400).json({ message: "Valid Phone Number and 4-digit PIN required." });
    }

    // Check if user exists
    const checkParams = {
      TableName: TABLE_NAME,
      Key: { phoneNumber: phoneNumber },
    };
    const existing = await docClient.send(new GetCommand(checkParams));
    if (existing.Item) {
      return res.status(400).json({ message: "User already exists." });
    }

    // Encrypt PIN
    const hashedPin = await bcrypt.hash(pin, 10);

    // Save User
    const newUser = {
      phoneNumber: phoneNumber,
      pin: hashedPin,
      name: name || "Farmer",
      role: "farmer",
      createdAt: new Date().toISOString(),
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: newUser,
    }));

    res.status(201).json({ message: "Signup successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// --- LOGIN ---
export const login = async (req, res) => {
  try {
    const { phoneNumber, pin } = req.body;

    // Get User
    const params = {
      TableName: TABLE_NAME,
      Key: { phoneNumber: phoneNumber },
    };
    const result = await docClient.send(new GetCommand(params));
    const user = result.Item;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check PIN
    const isMatch = await bcrypt.compare(pin, user.pin);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid PIN" });
    }

    // Generate Token
    const token = jwt.sign(
      { phoneNumber: user.phoneNumber }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    res.status(200).json({ 
      message: "Login successful", 
      token, 
      user: { name: user.name, phoneNumber: user.phoneNumber } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};