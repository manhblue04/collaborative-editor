import mongoose from "mongoose";

const collaboratorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["editor", "viewer"],
      default: "editor",
    },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: "Untitled Document",
    },
    yjsState: {
      type: Buffer,
      default: null,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    collaborators: {
      type: [collaboratorSchema],
      default: [],
    },
    shareLink: {
      token: { type: String, default: null },
      role: { type: String, enum: ["editor", "viewer"], default: "editor" },
      password: { type: String, default: null },
      enabled: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ ownerId: 1 });
documentSchema.index({ "collaborators.userId": 1 });

documentSchema.methods.getRole = function (userId) {
  if (!userId) return null;
  const id = userId.toString();
  if (this.ownerId.toString() === id) return "owner";
  const collab = this.collaborators.find((c) => c.userId.toString() === id);
  return collab ? collab.role : null;
};

documentSchema.methods.canRead = function (userId) {
  return this.getRole(userId) !== null;
};

documentSchema.methods.canEdit = function (userId) {
  const role = this.getRole(userId);
  return role === "owner" || role === "editor";
};

documentSchema.methods.canManage = function (userId) {
  return this.getRole(userId) === "owner";
};

export default mongoose.model("Document", documentSchema);
