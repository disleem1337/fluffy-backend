import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
    },
    username: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: false,
    },
    walletAddress: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      required: false,
      default: null,
    },
    setup: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
