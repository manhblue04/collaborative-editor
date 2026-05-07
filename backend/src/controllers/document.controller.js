import Document from "../models/Document.js";
import DocumentPermission from "../models/DocumentPermission.js";

// ─── Create Document ────────────────────────────────────────────────
export const createDocument = async (req, res, next) => {
  try {
    const { title = "Untitled Document" } = req.body;

    const doc = await Document.create({
      title,
      owner: req.user._id,
    });

    // Auto-create owner permission
    await DocumentPermission.create({
      documentId: doc._id,
      userId: req.user._id,
      role: "owner",
    });

    res.status(201).json({
      id: doc._id,
      title: doc.title,
      ownerId: doc.owner,
      createdAt: doc.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Documents (owned + shared) ─────────────────────────────────
export const getDocuments = async (req, res, next) => {
  try {
    // Find all document IDs the user has access to
    const permissions = await DocumentPermission.find({
      userId: req.user._id,
    });

    const docIds = permissions.map((p) => p.documentId);

    const docs = await Document.find({
      _id: { $in: docIds },
      isDeleted: false,
    })
      .sort({ updatedAt: -1 })
      .populate("owner", "name email");

    const permMap = {};
    permissions.forEach((p) => {
      permMap[p.documentId.toString()] = p.role;
    });

    res.status(200).json(
      docs.map((doc) => ({
        id: doc._id,
        title: doc.title,
        ownerId: doc.owner._id,
        ownerName: doc.owner.name,
        role: permMap[doc._id.toString()] || "viewer",
        updatedAt: doc.updatedAt,
      }))
    );
  } catch (error) {
    next(error);
  }
};

// ─── Get Document By ID (metadata only) ──────────────────────────────
export const getDocumentById = async (req, res, next) => {
  try {
    // Check if user has permission
    const permission = await DocumentPermission.findOne({
      documentId: req.params.id,
      userId: req.user._id,
    });

    if (!permission) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const doc = await Document.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).populate("owner", "name email");

    if (!doc) {
      return res.status(404).json({ error: "Document not found." });
    }

    res.status(200).json({
      id: doc._id,
      title: doc.title,
      ownerId: doc.owner._id,
      ownerName: doc.owner.name,
      role: permission.role,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Document (title) ─────────────────────────────────────────
export const updateDocument = async (req, res, next) => {
  try {
    const { title } = req.body;

    // Only owner or editor can update
    const permission = await DocumentPermission.findOne({
      documentId: req.params.id,
      userId: req.user._id,
      role: { $in: ["owner", "editor"] },
    });

    if (!permission) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const doc = await Document.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { title },
      { new: true, runValidators: true }
    );

    if (!doc) {
      return res.status(404).json({ error: "Document not found." });
    }

    res.status(200).json({ message: "Document updated" });
  } catch (error) {
    next(error);
  }
};

// ─── Delete Document (soft delete, owner only) ──────────────────────
export const deleteDocument = async (req, res, next) => {
  try {
    // Only owner can delete
    const permission = await DocumentPermission.findOne({
      documentId: req.params.id,
      userId: req.user._id,
      role: "owner",
    });

    if (!permission) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const doc = await Document.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );

    if (!doc) {
      return res.status(404).json({ error: "Document not found." });
    }

    res.status(200).json({ message: "Document deleted" });
  } catch (error) {
    next(error);
  }
};

// ─── Share Document ──────────────────────────────────────────────────
export const shareDocument = async (req, res, next) => {
  try {
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ error: "userId and role are required." });
    }

    if (!["editor", "viewer"].includes(role)) {
      return res
        .status(400)
        .json({ error: "Role must be 'editor' or 'viewer'." });
    }

    // Only owner can share
    const ownerPermission = await DocumentPermission.findOne({
      documentId: req.params.id,
      userId: req.user._id,
      role: "owner",
    });

    if (!ownerPermission) {
      return res
        .status(403)
        .json({ error: "Only the owner can share a document." });
    }

    // Check document exists
    const doc = await Document.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!doc) {
      return res.status(404).json({ error: "Document not found." });
    }

    // Cannot share with yourself
    if (userId === req.user._id.toString()) {
      return res
        .status(400)
        .json({ error: "You cannot change your own owner role." });
    }

    // Upsert permission
    await DocumentPermission.findOneAndUpdate(
      { documentId: req.params.id, userId },
      { role },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Document shared successfully." });
  } catch (error) {
    next(error);
  }
};

// ─── Remove Share / Revoke Permission ────────────────────────────────
export const removeShare = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Only owner can revoke
    const ownerPermission = await DocumentPermission.findOne({
      documentId: req.params.id,
      userId: req.user._id,
      role: "owner",
    });

    if (!ownerPermission) {
      return res
        .status(403)
        .json({ error: "Only the owner can revoke access." });
    }

    // Cannot remove owner's own permission
    if (userId === req.user._id.toString()) {
      return res
        .status(400)
        .json({ error: "Cannot remove owner permission." });
    }

    const deleted = await DocumentPermission.findOneAndDelete({
      documentId: req.params.id,
      userId,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Permission not found." });
    }

    res.status(200).json({ message: "Permission revoked." });
  } catch (error) {
    next(error);
  }
};

// ─── Get Document Permissions ────────────────────────────────────────
export const getDocumentPermissions = async (req, res, next) => {
  try {
    // Only owner/editor can view permissions
    const permission = await DocumentPermission.findOne({
      documentId: req.params.id,
      userId: req.user._id,
      role: { $in: ["owner", "editor"] },
    });

    if (!permission) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const permissions = await DocumentPermission.find({
      documentId: req.params.id,
    }).populate("userId", "name email");

    res.status(200).json(
      permissions.map((p) => ({
        userId: p.userId._id,
        name: p.userId.name,
        email: p.userId.email,
        role: p.role,
      }))
    );
  } catch (error) {
    next(error);
  }
};
