import mongoose from "mongoose";

const versionSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    yjsState: {
      type: Buffer,
      required: true,
    },
    label: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null = auto-saved
    },
    isAuto: {
      type: Boolean,
      default: false, // true = tự động lưu khi room trống
    },
  },
  {
    timestamps: true,
  }
);

// Giới hạn mỗi document tối đa 50 version — xóa cũ nhất khi vượt quá
versionSchema.statics.pruneOldVersions = async function (documentId, maxVersions = 50) {
  const count = await this.countDocuments({ documentId });
  if (count > maxVersions) {
    const oldest = await this.find({ documentId })
      .sort({ createdAt: 1 })
      .limit(count - maxVersions)
      .select("_id");
    await this.deleteMany({ _id: { $in: oldest.map((v) => v._id) } });
  }
};

export default mongoose.model("Version", versionSchema);
