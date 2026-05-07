import User from "../models/User.js";

// @desc    Search users by email (for sharing documents)
// @route   GET /users/search?email=...
// @access  Private
export const searchUsers = async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email || email.trim().length < 2) {
      return res
        .status(400)
        .json({ error: "Please provide at least 2 characters to search." });
    }

    const users = await User.find({
      email: { $regex: email.trim(), $options: "i" },
      _id: { $ne: req.user._id }, // exclude self
    })
      .select("name email")
      .limit(10);

    res.status(200).json(
      users.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
      }))
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /users
// @access  Private
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("name email");

    res.status(200).json(
      users.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
      }))
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /users/:id
// @access  Private
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("name email");

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};
