const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const ScoringConfig = require('../models/ScoringConfig');
const { logActivity } = require('../services/auditLogger');

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'hiresense_super_secure_jwt_secret_key_2026_recruit_intelligence';
  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res.cookie('token', token, cookieOptions);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      title: user.title,
      avatar: user.avatar,
      organization: user.organization,
      preferences: user.preferences,
    },
  });
};

// @desc    Register new user & create initial organization
// @route   POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, organizationName, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Create or find Organization
    const orgName = organizationName || `${name.split(' ')[0]}'s Talent Team`;
    const orgSlug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);
    const organization = await Organization.create({
      name: orgName,
      slug: orgSlug,
    });

    // Create default scoring config for organization
    await ScoringConfig.create({
      organization: organization._id,
      weights: { skills: 40, semantic: 30, experience: 20, qualification: 10 },
      minimumReviewThreshold: 60,
      shortlistThreshold: 75,
    });

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'admin',
      organization: organization._id,
      title: 'Principal Talent Acquisition Lead',
    });

    await logActivity({
      organizationId: organization._id,
      userId: user._id,
      action: 'USER_REGISTERED',
      entityType: 'Settings',
      entityId: user._id,
      details: { email: user.email, orgName },
      req,
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).populate('organization');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    await logActivity({
      organizationId: user.organization._id,
      userId: user._id,
      action: 'USER_LOGIN',
      entityType: 'Settings',
      entityId: user._id,
      details: { email: user.email },
      req,
    });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('organization');
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
const logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully',
  });
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, title, preferences } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (title) user.title = title;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  updateProfile,
};
