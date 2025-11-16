import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js'; // Make sure this path is correct

export const registerUser = async (req, res) => {
  try {
    // Get all fields from the form, including farmerId
    const { fullName, name, email, password, role, farmerId } = req.body;

    // --- THIS IS THE FIX ---
    // We will check for 'fullName' OR 'name' from the request body.
    const nameToSave = fullName || name;

    if (!nameToSave) {
      console.error('*** REGISTRATION ERROR ***', 'Request body was missing "fullName" or "name" field.');
      return res.status(400).json({ message: 'Full name is required.' });
    }
    // --- END OF FIX ---

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // --- THIS IS THE FIX ---
    // Create new user, and this time, ACTUALLY INCLUDE the farmerId
    const newUser = new User({
      name: nameToSave,
      username: email,
      email,
      password: hashedPassword,
      role: role || 'farmer',
      farmerId: farmerId // <-- THE MISSING LINE IS NOW HERE
    });
    
    await newUser.save(); // This will now save the farmerId

    // Create token
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        fullName: newUser.name, 
        email: newUser.email,
        role: newUser.role,
        farmerId: newUser.farmerId // <-- Send it back to the frontend
      },
    });
  
  } catch (error) {
    // This will catch any other errors, like a duplicate farmerId
    console.error('*** REGISTRATION ERROR ***', error.message); 
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, farmerId, password } = req.body;

    // Find user by either farmerId or email
    let user;
    if (farmerId) {
      user = await User.findOne({ farmerId: farmerId });
    } else if (email) {
      user = await User.findOne({ email: email });
    } else {
      return res.status(400).json({ message: 'Please provide an email or Farmer ID' });
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials (user not found)' });
    }

    // Check password
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials (password incorrect)' });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        fullName: user.name, 
        email: user.email,
        role: user.role,
        farmerId: user.farmerId // <-- Send it back on login too
      },
    });

  } catch (error) {
    console.error('*** LOGIN ERROR ***', error);
    res.status(500).json({ message: 'Server error during login: ' + error.message });
  }
};