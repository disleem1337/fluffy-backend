import mongoose from "mongoose";

const PostLikeSchema = new mongoose.Schema(
  {
    commentid: {
      type: mongoose.Schema.Types.ObjectId,
    },
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
  },
  { timestamps: true }
);

export default mongoose.model("PostLike", PostLikeSchema);
