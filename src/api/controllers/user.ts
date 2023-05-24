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
import UserFollow from "../../models/userFollow";
import notification from "../../models/notification";

const setupSchema = Joi.object({
  name: Joi.string().alphanum().required().min(3).max(64),
  username: Joi.string().alphanum().required().min(3).max(64),
  email: Joi.string().email().required(),
});

class UserController {
  public async me(req: RequestWithUser, res: Response): Promise<any> {
    User.aggregate(
      [
        {
          $match: { _id: new mongoose.Types.ObjectId(req.id) },
        },
        {
          $lookup: {
            from: "userfollows",
            localField: "_id",
            foreignField: "followerId",
            as: "followings",
          },
        },
        {
          $lookup: {
            from: "userfollows",
            localField: "_id",
            foreignField: "followingId",
            as: "followers",
          },
        },
        {
          $addFields: {
            followerCount: { $size: "$followers" },
            followingCount: { $size: "$followings" },
          },
        },
        {
          $unset: ["followers", "followings"],
        },
      ],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Server error" });
        }

        const user = result[0];

        if (!user) return res.status(404).json({ message: "User not found" });

        return res.status(200).json({ message: "OK", user });
      }
    );
  }

  public async getUserById(req: RequestWithUser, res: Response): Promise<any> {
    const id = req.params["id"];

    if (!id) return res.status(400).json({ message: "User id is required" });

    User.aggregate(
      [
        {
          $match: { _id: new mongoose.Types.ObjectId(id) },
        },
        {
          $lookup: {
            from: "userfollows",
            localField: "_id",
            foreignField: "followerId",
            as: "followings",
          },
        },
        {
          $lookup: {
            from: "userfollows",
            localField: "_id",
            foreignField: "followingId",
            as: "followers",
          },
        },
        {
          $addFields: {
            followerCount: { $size: "$followers" },
            followingCount: { $size: "$followings" },
            following: {
              $in: [
                new mongoose.Types.ObjectId(req.id),
                "$followers.followerId",
              ],
            },
          },
        },
        {
          $unset: ["followers", "followings"],
        },
      ],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Server error" });
        }

        const user = result[0];

        if (!user) return res.status(404).json({ message: "User not found" });

        return res.status(200).json({ message: "OK", user });
      }
    );
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
    const [userCount, postCount, postLikeCount, postCommentCount] =
      await Promise.all([
        User.countDocuments(),
        Post.count({ userid: id }),
        PostLike.count({ userid: id }),
        PostComment.count({ userid: id }),
      ]);

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

  public async getOtherStats(
    req: RequestWithUser,
    res: Response
  ): Promise<any> {
    const { userid } = req.body;

    if (!userid)
      return res.status(400).json({ message: "User id is required" });

    const user = await User.findById(userid);

    if (!user) return res.status(404).json({ message: "User not found" });

    const userCreatedAt = user.createdAt.toISOString();
    const [userCount, postCount, postLikeCount, postCommentCount] =
      await Promise.all([
        User.countDocuments(),
        Post.count({ userid: userid }),
        PostLike.count({ userid: userid }),
        PostComment.count({ userid: userid }),
      ]);

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
    User.aggregate(
      [
        {
          $limit: 5,
        },
        {
          $lookup: {
            from: "userfollows",
            localField: "_id",
            foreignField: "followerId",
            as: "followings",
          },
        },
        {
          $lookup: {
            from: "userfollows",
            localField: "_id",
            foreignField: "followingId",
            as: "followers",
          },
        },
        {
          $addFields: {
            followerCount: { $size: "$followers" },
            followingCount: { $size: "$followings" },
            following: {
              $in: [
                new mongoose.Types.ObjectId(req.id),
                "$followers.followerId",
              ],
            },
          },
        },
        {
          $unset: ["followers", "followings"],
        },
      ],
      (err, users) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Server error" });
        }
        return res.status(200).json({ message: "OK", data: users });
      }
    );
  }

  public async follow(req: RequestWithUser, res: Response) {
    const id = req.params.id;

    const userToFollow = await User.findById(req.id);

    if (!userToFollow)
      return res.status(404).json({ message: "User not found" });

    const userFollow = new UserFollow();
    userFollow.followerId = new mongoose.Types.ObjectId(req.id);
    userFollow.followingId = new mongoose.Types.ObjectId(id);

    await userFollow.save();

    if (userToFollow._id.toString() != id) {
      const Notification = new notification({
        sourceUser: new mongoose.Types.ObjectId(req.id),
        destinationUser: new mongoose.Types.ObjectId(userFollow._id),
        action: "follow",
        metadata: {
          message: `${userToFollow.username} adlı kullanıcı sizi takip etti.`,
        },
      });
      await Notification.save();
    }

    return res.status(200).json({
      message: "OK",
    });
  }

  public async unfollow(req: RequestWithUser, res: Response) {
    const id = req.params.id;

    const userFollow = await UserFollow.findOne({
      followerId: new mongoose.Types.ObjectId(req.id),
      followingId: new mongoose.Types.ObjectId(id),
    });

    if (!userFollow)
      return res.status(404).json({ message: "You don't follow him already" });

    await userFollow.remove();

    return res.status(200).json({
      message: "OK",
    });
  }
}

export default new UserController();
