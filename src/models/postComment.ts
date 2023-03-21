import mongoose from "mongoose";

const PostCommentSchema = new mongoose.Schema(
  {
    postid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
      required: false,
    },
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: false,
    },
    comment: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("PostComment", PostCommentSchema);
