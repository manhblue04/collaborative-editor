import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: "Untitled Document",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Yjs binary state snapshot (optional - for backup/restore/fast load)
    ydocState: {
      type: Buffer,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
documentSchema.index({ owner: 1, createdAt: -1 });
documentSchema.index({ isDeleted: 1 });

export default mongoose.model("Document", documentSchema);
