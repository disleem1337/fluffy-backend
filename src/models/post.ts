import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: false,
    },
    desc: {
      type: String,
      required: false,
    },
    content: {
      type: Array,
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Post", PostSchema);
