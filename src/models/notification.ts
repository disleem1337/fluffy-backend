import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    NotificationOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    message: {
      type: String,
      required: false,
    },
    action: {
      type: String,
      required: false,
      enum: ["like", "comment", "follow"],
    },
    notify: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", NotificationSchema);
