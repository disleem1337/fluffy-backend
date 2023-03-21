import { Request, Response } from "express";
import { utils } from "ethers";
import jsonwebtoken from "jsonwebtoken";
import User from "../../models/user";
import { RequestWithUser } from "../../types/requestWithUser";
import { s3, bucketName, region } from "../../s3";
import { randomUUID } from "crypto";
import post from "../../models/post";
import postLike from "../../models/postLike";
import postComment from "../../models/postComment";
import mongoose from "mongoose";

class PostController {
  public async CreatePost(req: RequestWithUser, res: Response): Promise<any> {
    const { desc } = req.body;

    const images = req.files["images"];
    const videos = req.files["video"];

    if (!desc && !images && !videos)
      return res.status(400).json({ message: "Content is required" });

    const content = [];

    const ContentSchema = new Map(
      Object.entries({
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        mp4: "video/mp4",
      })
    );

    if (images) {
      await Promise.all(
        images.map(async (image: any) => {
          const extension = image.originalname.slice(
            image.originalname.lastIndexOf(".") + 1
          );

          if (!["jpg", "jpeg", "png", "mp4"].includes(extension))
            return res.status(400).json({ message: "Invalid image format" });

          try {
            const s3FilePath = `post/${randomUUID()}.${extension}`;
            const res = await s3
              .putObject({
                Bucket: bucketName,
                Key: s3FilePath,
                Body: image.buffer,
                ContentType: ContentSchema.get(extension),
              })
              .promise();

            content.push({
              type: "image",
              url:
                "https://fluffy-a1.s3.eu-central-1.amazonaws.com/" + s3FilePath,
            });
          } catch (err) {
            return res.status(400).json({ message: err });
          }
        })
      );
    }

    if (videos) {
      await Promise.all(
        videos.map(async (video: any) => {
          const extension = video.originalname.slice(
            video.originalname.lastIndexOf(".") + 1
          );

          if (!["mp4"].includes(extension))
            return res.status(400).json({ message: "Invalid image format" });

          try {
            const s3FilePath = `post/${randomUUID()}.${extension}`;
            const res = await s3
              .putObject({
                Bucket: bucketName,
                Key: s3FilePath,
                Body: video.buffer,
                ContentType: ContentSchema.get(extension),
              })
              .promise();

            content.push({
              type: "video",
              url:
                "https://fluffy-a1.s3.eu-central-1.amazonaws.com/" + s3FilePath,
            });
          } catch (err) {
            return res.status(400).json({ message: err });
          }
        })
      );
    }

    const Post = new post({
      userid: new mongoose.Types.ObjectId(req.id),
      desc: desc,
      content: content,
    });

    await Post.save();

    return res.status(200).json({ message: "OK", data: { post: Post } });
  }

  public async getUserPost(req: RequestWithUser, res: Response): Promise<any> {
    post.aggregate(
      [
        { $match: { userid: new mongoose.Types.ObjectId(req.id) } },
        {
          $lookup: {
            from: "users",
            localField: "userid",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $lookup: {
            from: "postlikes",
            localField: "_id",
            foreignField: "postid",
            as: "likes",
          },
        },
        {
          $lookup: {
            from: "postcomments",
            localField: "_id",
            foreignField: "postid",
            as: "comments",
          },
        },
        {
          $addFields: {
            likeCount: { $size: "$likes" },
            commentCount: { $size: "$comments" },
            liked: {
              $in: [new mongoose.Types.ObjectId(req.id), "$likes.userid"],
            },
          },
        },
        {
          $unset: ["likes"],
        },
      ],
      function (err, result) {
        if (err) {
          return res.status(400).json({ message: err });
        }

        return res
          .status(200)
          .json({ message: "OK", user: req.id, userposts: result });
      }
    );
  }

  public async getFeed(req: RequestWithUser, res: Response): Promise<any> {
    post.aggregate(
      [
        { $sort: { createdAt: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "userid",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $lookup: {
            from: "postcomments",
            localField: "_id",
            foreignField: "postid",
            as: "comments",
          },
        },
        {
          $lookup: {
            from: "postlikes",
            localField: "_id",
            foreignField: "postid",
            as: "likes",
          },
        },
        {
          $addFields: {
            likeCount: { $size: "$likes" },
            commentCount: { $size: "$comments" },
            liked: {
              $in: [new mongoose.Types.ObjectId(req.id), "$likes.userid"],
            },
          },
        },
        {
          $unset: ["likes"],
        },
      ],
      function (err, result) {
        if (err) {
          return res.status(400).json({ message: err });
        }

        return res.json({ message: "OK", data: result });
      }
    );
  }

  public async likePost(req: RequestWithUser, res: Response): Promise<any> {
    const { postid } = req.body;

    if (!postid)
      return res.status(404).json({ message: "Post id is required" });

    const PostLiked = await postLike.findOne({
      postid: new mongoose.Types.ObjectId(postid),
      userid: new mongoose.Types.ObjectId(req.id),
    });

    if (PostLiked) {
      return res.status(400).json({ message: "Post already liked" });
    }

    const PostLike = new postLike({
      postid: new mongoose.Types.ObjectId(postid),
      userid: new mongoose.Types.ObjectId(req.id),
    });

    await PostLike.save();

    return res.status(200).json({ message: "Liked post" });
  }

  public async unlikePost(req: RequestWithUser, res: Response): Promise<any> {
    const { postid } = req.body;

    if (!postid)
      return res.status(404).json({ message: "Post id is required" });

    const PostLiked = await postLike.findOne({
      postid: new mongoose.Types.ObjectId(postid),
      userid: new mongoose.Types.ObjectId(req.id),
    });

    if (!PostLiked) {
      return res.status(400).json({ message: "Post not liked" });
    }

    await postLike.deleteOne({
      postid: new mongoose.Types.ObjectId(postid),
      userid: new mongoose.Types.ObjectId(req.id),
    });

    return res.status(200).json({ message: "Unliked post" });
  }

  public async commentPost(req: RequestWithUser, res: Response): Promise<any> {
    const { postid, comment } = req.body;

    if (!postid)
      return res.status(404).json({ message: "Post id is required" });

    if (!comment)
      return res.status(404).json({ message: "Comment is required" });

    const PostComment = new postComment({
      postid: new mongoose.Types.ObjectId(postid),
      userid: new mongoose.Types.ObjectId(req.id),
      comment: comment,
    });

    await PostComment.save();

    return res.status(200).json({ message: "Commented post" });
  }

  public async deleteComment(
    req: RequestWithUser,
    res: Response
  ): Promise<any> {
    const { commentid } = req.body;

    if (!commentid)
      return res.status(404).json({ message: "Comment id is required" });

    const Comment = await postComment.findOne({
      _id: new mongoose.Types.ObjectId(commentid),
    });

    if (!Comment) {
      return res.status(400).json({ message: "Comment not found" });
    }

    await postComment.deleteOne({
      _id: new mongoose.Types.ObjectId(commentid),
    });

    return res.status(200).json({ message: "Deleted comment" });
  }
}

export default new PostController();
