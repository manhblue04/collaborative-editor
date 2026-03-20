import Document from "../models/Document.js";

export const createDocument = async (req, res, next) => {
  try {
    const { title = "Untitled Document" } = req.body;

    const doc = await Document.create({
      title,
      ownerId: req.user._id,
    });

    res.status(201).json({
      id: doc._id,
      title: doc.title,
      ownerId: doc.ownerId,
      createdAt: doc.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

export const getDocuments = async (req, res, next) => {
  try {
    const docs = await Document.find({ ownerId: req.user._id }).sort({
      updatedAt: -1,
    });

    res.status(200).json(
      docs.map((doc) => ({
        id: doc._id,
        title: doc.title,
        ownerId: doc.ownerId,
        updatedAt: doc.updatedAt,
      }))
    );
  } catch (error) {
    next(error);
  }
};

export const getDocumentById = async (req, res, next) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    });

    if (!doc) {
      return res.status(404).json({ message: "Document not found." });
    }

    res.status(200).json({
      id: doc._id,
      title: doc.title,
      ownerId: doc.ownerId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDocument = async (req, res, next) => {
  try {
    const { title } = req.body;

    const doc = await Document.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user._id },
      { title },
      { new: true, runValidators: true }
    );

    if (!doc) {
      return res.status(404).json({ message: "Document not found." });
    }

    res.status(200).json({ message: "Document updated" });
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user._id,
    });

    if (!doc) {
      return res.status(404).json({ message: "Document not found." });
    }

    res.status(200).json({ message: "Document deleted" });
  } catch (error) {
    next(error);
  }
};
