import crypto from "crypto";
import bcrypt from "bcryptjs";
import Document from "../models/Document.js";
import User from "../models/User.js";

const formatDocument = (doc, currentUserId) => ({
  id: doc._id,
  title: doc.title,
  ownerId: doc.ownerId,
  role: doc.getRole(currentUserId),
  collaborators: doc.collaborators?.map((c) => ({
    userId: c.userId,
    role: c.role,
  })),
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const findAccessibleDoc = async (id, userId) => {
  const doc = await Document.findOne({
    _id: id,
    $or: [{ ownerId: userId }, { "collaborators.userId": userId }],
  });
  return doc;
};

export const createDocument = async (req, res, next) => {
  try {
    const { title = "Untitled Document" } = req.body;
    const doc = await Document.create({
      title,
      ownerId: req.user._id,
    });
    res.status(201).json(formatDocument(doc, req.user._id));
  } catch (error) {
    next(error);
  }
};

export const getDocuments = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const docs = await Document.find({
      $or: [{ ownerId: userId }, { "collaborators.userId": userId }],
    }).sort({ updatedAt: -1 });

    res.status(200).json(docs.map((doc) => formatDocument(doc, userId)));
  } catch (error) {
    next(error);
  }
};

export const getDocumentById = async (req, res, next) => {
  try {
    const doc = await findAccessibleDoc(req.params.id, req.user._id);
    if (!doc) return res.status(404).json({ error: "Document not found." });
    res.status(200).json(formatDocument(doc, req.user._id));
  } catch (error) {
    next(error);
  }
};

export const updateDocument = async (req, res, next) => {
  try {
    const doc = await findAccessibleDoc(req.params.id, req.user._id);
    if (!doc) return res.status(404).json({ error: "Document not found." });

    if (!doc.canEdit(req.user._id)) {
      return res.status(403).json({ error: "Insufficient permissions." });
    }

    const { title } = req.body;
    if (title !== undefined) doc.title = title;
    await doc.save();

    res.status(200).json({ message: "Document updated" });
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    });
    if (!doc) return res.status(404).json({ error: "Document not found." });

    await doc.deleteOne();
    res.status(200).json({ message: "Document deleted" });
  } catch (error) {
    next(error);
  }
};

export const getDocumentState = async (req, res, next) => {
  try {
    const doc = await findAccessibleDoc(req.params.id, req.user._id);
    if (!doc) return res.status(404).json({ error: "Document not found." });

    res.status(200).json({
      state: doc.yjsState ? doc.yjsState.toString("base64") : null,
    });
  } catch (error) {
    next(error);
  }
};

export const saveDocumentState = async (req, res, next) => {
  try {
    const doc = await findAccessibleDoc(req.params.id, req.user._id);
    if (!doc) return res.status(404).json({ error: "Document not found." });

    if (!doc.canEdit(req.user._id)) {
      return res.status(403).json({ error: "Insufficient permissions." });
    }

    const { state } = req.body;
    if (!state) return res.status(400).json({ error: "Missing state." });

    doc.yjsState = Buffer.from(state, "base64");
    await doc.save();

    res.status(200).json({ message: "Document state saved" });
  } catch (error) {
    next(error);
  }
};

export const shareDocument = async (req, res, next) => {
  try {
    const { email, userId, role = "editor" } = req.body;

    if (!["editor", "viewer"].includes(role)) {
      return res.status(400).json({ error: "Invalid role." });
    }

    const doc = await Document.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    });
    if (!doc) return res.status(404).json({ error: "Document not found." });

    let target;
    if (userId) target = await User.findById(userId);
    else if (email) target = await User.findOne({ email: email.toLowerCase() });

    if (!target) return res.status(404).json({ error: "User not found." });
    if (target._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "Cannot share with yourself." });
    }

    const existing = doc.collaborators.find(
      (c) => c.userId.toString() === target._id.toString()
    );
    if (existing) existing.role = role;
    else doc.collaborators.push({ userId: target._id, role });

    await doc.save();
    res.status(200).json({ message: "Permission updated" });
  } catch (error) {
    next(error);
  }
};

export const getPermissions = async (req, res, next) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      $or: [
        { ownerId: req.user._id },
        { "collaborators.userId": req.user._id },
      ],
    }).populate("ownerId", "name email").populate("collaborators.userId", "name email");

    if (!doc) return res.status(404).json({ error: "Document not found." });

    const list = [
      {
        userId: doc.ownerId._id,
        name: doc.ownerId.name,
        email: doc.ownerId.email,
        role: "owner",
      },
      ...doc.collaborators.map((c) => ({
        userId: c.userId._id,
        name: c.userId.name,
        email: c.userId.email,
        role: c.role,
      })),
    ];

    res.status(200).json(list);
  } catch (error) {
    next(error);
  }
};

export const revokePermission = async (req, res, next) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    });
    if (!doc) return res.status(404).json({ error: "Document not found." });

    doc.collaborators = doc.collaborators.filter(
      (c) => c.userId.toString() !== req.params.userId
    );
    await doc.save();
    res.status(200).json({ message: "Permission revoked" });
  } catch (error) {
    next(error);
  }
};

// ── Share Link ──

export const generateShareLink = async (req, res, next) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    });
    if (!doc) return res.status(404).json({ error: "Document not found." });

    const { role = "editor", password } = req.body;
    if (!["editor", "viewer"].includes(role)) {
      return res.status(400).json({ error: "Invalid role." });
    }

    const token = crypto.randomUUID();
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    doc.shareLink = { token, role, password: hashedPassword, enabled: true };
    await doc.save();

    res.status(200).json({
      token,
      role,
      hasPassword: !!password,
      url: `/join/${token}`,
    });
  } catch (error) {
    next(error);
  }
};

export const getShareLink = async (req, res, next) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      $or: [
        { ownerId: req.user._id },
        { "collaborators.userId": req.user._id },
      ],
    });
    if (!doc) return res.status(404).json({ error: "Document not found." });

    if (!doc.shareLink?.enabled) {
      return res.status(200).json(null);
    }

    res.status(200).json({
      token: doc.shareLink.token,
      role: doc.shareLink.role,
      hasPassword: !!doc.shareLink.password,
      url: `/join/${doc.shareLink.token}`,
    });
  } catch (error) {
    next(error);
  }
};

export const revokeShareLink = async (req, res, next) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    });
    if (!doc) return res.status(404).json({ error: "Document not found." });

    doc.shareLink = { token: null, role: "editor", password: null, enabled: false };
    await doc.save();

    res.status(200).json({ message: "Share link revoked" });
  } catch (error) {
    next(error);
  }
};

export const joinByLink = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const doc = await Document.findOne({
      "shareLink.token": token,
      "shareLink.enabled": true,
    });
    if (!doc) return res.status(404).json({ error: "Invalid or expired link." });

    // Check password
    if (doc.shareLink.password) {
      if (!password) {
        return res.status(403).json({ error: "Password required.", requirePassword: true });
      }
      const valid = await bcrypt.compare(password, doc.shareLink.password);
      if (!valid) {
        return res.status(403).json({ error: "Incorrect password." });
      }
    }

    const userId = req.user._id;

    // Owner cannot join their own doc
    if (doc.ownerId.toString() === userId.toString()) {
      return res.status(200).json({ documentId: doc._id, role: "owner" });
    }

    // Atomic upsert: try update existing first, then push if not found
    const updated = await Document.findOneAndUpdate(
      { _id: doc._id, "collaborators.userId": userId },
      { $set: { "collaborators.$.role": doc.shareLink.role } },
      { new: true }
    );

    if (!updated) {
      await Document.updateOne(
        { _id: doc._id, "collaborators.userId": { $ne: userId } },
        { $push: { collaborators: { userId, role: doc.shareLink.role } } }
      );
    }

    const freshDoc = await Document.findById(doc._id);
    res.status(200).json({ documentId: doc._id, role: freshDoc.getRole(userId) });
  } catch (error) {
    next(error);
  }
};
