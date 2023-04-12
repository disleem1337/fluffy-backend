import { Request, Response } from "express";
import { utils } from "ethers";
import User from "../../models/user";
import Post from "../../models/post";
import PostLike from "../../models/postLike";
import PostComment from "../../models/postComment";
import Joi from "joi";
import { RequestWithUser } from "../../types/requestWithUser";
import { s3, bucketName, region } from "../../s3";
import { randomUUID } from "crypto";
import mongoose from "mongoose";

const setupSchema = Joi.object({
  name: Joi.string().alphanum().required().min(3).max(64),
  username: Joi.string().alphanum().required().min(3).max(64),
  email: Joi.string().email().required(),
});

class UserController {
  public async me(req: RequestWithUser, res: Response): Promise<any> {
    const user = await User.findById(req.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ message: "OK", user });
  }

  public async getUserById(req: RequestWithUser, res: Response): Promise<any> {
    const id = req.params["id"];

    if (!id) return res.status(400).json({ message: "User id is required" });

    try {
      const user = await User.findById(new mongoose.Types.ObjectId(id));

      if (!user) return res.status(404).json({ message: "User not found" });

      return res.status(200).json({ message: "OK", user });
    } catch (err) {
      return res.status(500).json({ message: "Server error" });
    }
  }

  public async setup(req: RequestWithUser, res: Response): Promise<any> {
    const { name, username, email } = req.body;
    const profileImage = req.file;

    const { error } = setupSchema.validate({
      name,
      username,
      email,
    });

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const user = await User.findById(req.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.setup) {
      return res.status(400).json({ message: "User already setup" });
    }

    const userWithSameUsername = await User.findOne({
      username: username.toLowerCase(),
    });

    if (userWithSameUsername) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const userWithSameEmail = await User.findOne({
      email: email.toLowerCase(),
    });

    if (userWithSameEmail) {
      return res.status(400).json({ message: "Email already taken" });
    }

    if (req.file) {
      const extension = req.file.originalname.slice(
        req.file.originalname.lastIndexOf(".") + 1
      );

      if (!extension)
        return res.status(400).json({ message: "Bad profile image" });
      try {
        const s3FilePath = `profile/${randomUUID()}.${extension}`;
        const res = await s3
          .putObject({
            Bucket: bucketName,
            Key: s3FilePath,
            Body: req.file.buffer,
          })
          .promise();

        user.profileImage =
          "https://fluffy-a1.s3.eu-central-1.amazonaws.com/" + s3FilePath;
      } catch (err) {
        return res.status(500).json({ message: "File upload failed" });
      }
    }

    user.name = name;
    user.username = username;
    user.email = email.toLowerCase();
    user.setup = true;

    await user.save();

    return res.status(200).json({ message: "OK" });
  }

  public async getStats(req: RequestWithUser, res: Response): Promise<any> {
    const id = req.id;

    if (!id) return res.status(400).json({ message: "User id is required" });

    const user = await User.findById(id);

    if (!user) return res.status(404).json({ message: "User not found" });

    const userCreatedAt = user.createdAt.toISOString();
    const userCount = await User.countDocuments();
    const postCount = await Post.count({ userid: id });
    const postLikeCount = await PostLike.count({ userid: id });
    const postCommentCount = await PostComment.count({ userid: id });

    return res.status(200).json({
      message: "OK",
      data: {
        userCreatedAt: userCreatedAt,
        userCount: userCount,
        postCount: postCount,
        postLikeCount: postLikeCount,
        postCommentCount: postCommentCount,
      },
    });
  }

  public async getAllUser(req: RequestWithUser, res: Response): Promise<any> {
    const users = await User.find().limit(5);

    if (!users) return res.status(404).json({ message: "Users not found" });

    return res.status(200).json({ message: "OK", data: users });
  }
}

export default new UserController();
