import User from "../models/User.js";

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-__v");
    res.status(200).json({
      totalCount: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-__v");
    if (!user) return res.status(404).json({ error: "User not found." });
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    if (
      req.user._id.toString() !== req.params.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ error: "Forbidden." });
    }

    const { password, role, ...updateData } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-__v");

    if (!user) return res.status(404).json({ error: "User not found." });
    res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found." });
    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    next(error);
  }
};
