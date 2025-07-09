// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db'); // Changed from pool to prisma
const speakeasy = require('speakeasy'); // Added for 2FA
require('dotenv').config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN;
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN;

// Helper function to generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
  const refreshToken = jwt.sign(
    { userId: user.id, email: user.email },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
  return { accessToken, refreshToken };
};

exports.register = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert new user
    const newUser = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        // role is 'member' by default (defined in schema)
      },
    });

    res.status(201).json({ message: 'User registered successfully!', userId: newUser.id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
};

exports.registerAdmin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert new user with admin role
    const newUser = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        role: 'admin',
      },
    });

    res.status(201).json({ message: 'Admin user registered successfully!', userId: newUser.id });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ message: 'Internal server error during admin registration.' });
  }
};

exports.login = async (req, res) => {
  const { email, password, token2FA } = req.body; // Added token2FA

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await prisma.users.findUnique({
      where: { email },
    });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials, Email not found' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Invalid credentials, Incorrect password' });
    }

    // Check if 2FA is enabled for the user
    if (user.two_factor_secret) {
      if (!token2FA) {
        return res.status(401).json({ message: '2FA token is required.' });
      }
      const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token: token2FA,
      });
      if (!verified) {
        return res.status(401).json({ message: 'Invalid 2FA token.' });
      }
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token in DB
    await prisma.users.update({
      where: { id: user.id },
      data: { refresh_token: refreshToken },
    });

    // Send refresh token via HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: 'Logged in successfully!',
      accessToken,
      userId: user.id,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
};

exports.refreshToken = async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json({ message: 'Refresh token not found.' });
  }

  try {
    const user = await prisma.users.findFirst({
      where: { refresh_token: incomingRefreshToken },
    });
    if (!user) {
      return res.status(403).json({ message: 'Invalid refresh token.' });
    }

    jwt.verify(incomingRefreshToken, REFRESH_TOKEN_SECRET, async (err, decoded) => {
      if (err || user.id !== decoded.userId) {
        return res.status(403).json({ message: 'Invalid refresh token verification.' });
      }

      const newAccessToken = jwt.sign(
        { userId: user.id, email: user.email },
        ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
      );

      res.status(200).json({ accessToken: newAccessToken });
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Internal server error during token refresh.' });
  }
};

exports.logout = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (token) {
    try {
      await prisma.users.updateMany({
        where: { refresh_token: token },
        data: { refresh_token: null },
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Continue to clear cookie even if DB update fails
    }
  }

  // Clear cookie on client
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.status(200).json({ message: 'Logged out successfully.' });
};

exports.enable2FA = async (req, res) => {
  const { userId } = req.user; // Assuming userId is available from authenticateToken middleware

  try {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.two_factor_secret) {
      return res.status(400).json({ message: '2FA is already enabled for this user.' });
    }

    const secret = speakeasy.generateSecret({ length: 20 });
    await prisma.users.update({
      where: { id: userId },
      data: { two_factor_secret: secret.base32 },
    });

    // For the user to scan the QR code, you would typically send secret.otpauth_url
    // For simplicity here, we send the base32 secret. In a real app, generate a QR code.
    res.status(200).json({
      message: '2FA enabled. Scan this secret with your authenticator app.',
      secret: secret.base32, // In a real app, you'd send an otpauth_url for QR code generation
      otpauth_url: secret.otpauth_url // Optional: send this to client to generate QR code
    });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({ message: 'Internal server error while enabling 2FA.' });
  }
};

exports.verify2FA = async (req, res) => {
  const { userId } = req.user;
  const { token2FA } = req.body;

  if (!token2FA) {
    return res.status(400).json({ message: '2FA token is required.' });
  }

  try {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user || !user.two_factor_secret) {
      return res.status(400).json({ message: '2FA is not enabled for this user or user not found.' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: token2FA,
    });

    if (verified) {
      // Potentially mark 2FA as verified for the session if needed, or just confirm success
      res.status(200).json({ message: '2FA token verified successfully.' });
    } else {
      res.status(401).json({ message: 'Invalid 2FA token.' });
    }
  } catch (error) {
    console.error('Verify 2FA error:', error);
    res.status(500).json({ message: 'Internal server error while verifying 2FA token.' });
  }
};

exports.checkToken = async (req, res) => {
  // The authenticateToken middleware (used in the route)
  // has already verified the token and attached its payload to req.user.
  // We simply return this information.
  if (req.user) {
    res.status(200).json({
      message: "Token is valid and here is its payload.",
      tokenPayload: req.user
    });
  } else {
    // This case should ideally not be reached if authenticateToken is working correctly
    // and has been applied to the route.
    res.status(403).json({ message: "No token payload found. Is the route protected?" });
  }
};