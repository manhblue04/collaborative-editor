import Document from "../models/Document.js";
import Version from "../models/Version.js";
import { kickRoom } from "../ws/yjsServer.js";

// Helper: kiểm tra quyền truy cập document
const findAccessibleDoc = async (id, userId) => {
  return Document.findOne({
    _id: id,
    $or: [{ ownerId: userId }, { "collaborators.userId": userId }],
  });
};

/**
 * GET /documents/:id/versions
 * Lấy danh sách version (không kèm yjsState để nhẹ)
 */
export const listVersions = async (req, res, next) => {
  try {
    const doc = await findAccessibleDoc(req.params.id, req.user._id);
    if (!doc) return res.status(404).json({ error: "Document not found." });

    const versions = await Version.find({ documentId: req.params.id })
      .sort({ createdAt: -1 })
      .select("-yjsState")
      .populate("createdBy", "name email");

    res.status(200).json(versions);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /documents/:id/versions
 * Lưu version thủ công (có thể kèm label)
 */
export const saveVersion = async (req, res, next) => {
  try {
    const doc = await findAccessibleDoc(req.params.id, req.user._id);
    if (!doc) return res.status(404).json({ error: "Document not found." });

    if (!doc.canEdit(req.user._id)) {
      return res.status(403).json({ error: "Insufficient permissions." });
    }

    if (!doc.yjsState) {
      return res.status(400).json({ error: "Document has no content to snapshot." });
    }

    const { label = "" } = req.body;

    const version = await Version.create({
      documentId: doc._id,
      yjsState: doc.yjsState,
      label: label.trim(),
      createdBy: req.user._id,
      isAuto: false,
    });

    await Version.pruneOldVersions(doc._id);

    res.status(201).json({
      id: version._id,
      label: version.label,
      isAuto: version.isAuto,
      createdBy: { name: req.user.name, email: req.user.email },
      createdAt: version.createdAt,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /documents/:id/versions/:versionId/state
 * Lấy yjsState của một version cụ thể (dùng để preview)
 */
export const getVersionState = async (req, res, next) => {
  try {
    const doc = await findAccessibleDoc(req.params.id, req.user._id);
    if (!doc) return res.status(404).json({ error: "Document not found." });

    const version = await Version.findOne({
      _id: req.params.versionId,
      documentId: req.params.id,
    });
    if (!version) return res.status(404).json({ error: "Version not found." });

    res.status(200).json({
      state: version.yjsState.toString("base64"),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /documents/:id/versions/:versionId/restore
 * Khôi phục document về một version cũ
 */
export const restoreVersion = async (req, res, next) => {
  try {
    const doc = await findAccessibleDoc(req.params.id, req.user._id);
    if (!doc) return res.status(404).json({ error: "Document not found." });

    if (!doc.canEdit(req.user._id)) {
      return res.status(403).json({ error: "Insufficient permissions." });
    }

    const version = await Version.findOne({
      _id: req.params.versionId,
      documentId: req.params.id,
    });
    if (!version) return res.status(404).json({ error: "Version not found." });

    // BƯỚC 1: Kick tất cả clients đang kết nối ra khỏi room TRƯỚC khi ghi đè state.
    // Nếu kick sau khi ghi DB, room debounced save (3s) có thể flush state cũ
    // từ ydoc in-memory đè state mới vừa ghi → mất dữ liệu khôi phục.
    // Kick trước cũng đảm bảo room mới sẽ tạo từ đầu với state đã restore từ DB.
    kickRoom(req.params.id);

    // BƯỚC 2: Lưu snapshot của bản hiện tại trước khi ghi đè (auto-save backup)
    if (doc.yjsState) {
      await Version.create({
        documentId: doc._id,
        yjsState: doc.yjsState,
        label: "Trước khi khôi phục",
        createdBy: req.user._id,
        isAuto: true,
      });
    }

    // BƯỚC 3: Ghi đè yjsState bằng state của version cũ.
    // Dùng findByIdAndUpdate thay vì doc.save() vì Mongoose không tự
    // detect Buffer đã thay đổi (so sánh reference) → doc.save() bị skip.
    await Document.findByIdAndUpdate(req.params.id, {
      yjsState: Buffer.from(version.yjsState),
    });

    await Version.pruneOldVersions(doc._id);

    res.status(200).json({ message: "Document restored successfully." });
  } catch (err) {
    next(err);
  }
};
