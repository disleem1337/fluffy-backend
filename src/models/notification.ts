import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    sourceUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: false,
    },
    destinationUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    action: {
      type: String,
      required: false,
      enum: ["like", "comment", "follow"],
    },
    metadata: {
      type: Object,
      required: false,
    },
    seen: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", NotificationSchema);
