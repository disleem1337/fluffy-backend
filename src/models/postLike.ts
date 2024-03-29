import mongoose from "mongoose";

const PostLikeSchema = new mongoose.Schema(
  {
    commentid: {
      type: mongoose.Schema.Types.ObjectId,
    },
    postid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
      required: true,
    },
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("PostLike", PostLikeSchema);
