import { Request, Response } from "express";
import { utils } from "ethers";
import jsonwebtoken from "jsonwebtoken";
import User from "../../models/user";
import { RequestWithUser } from "../../types/requestWithUser";
import { s3, bucketName, region } from "../../s3";
import { randomUUID } from "crypto";
import post from "../../models/post";

class PostController {
  public async CreatePost(req: RequestWithUser, res: Response): Promise<any> {
    const { desc } = req.body;

    const images = req.files["images"];
    const videos = req.files["video"];

    if (!images && !videos)
      return res.status(400).json({ message: "Images or Videos are required" });

    if (!desc)
      return res.status(400).json({ message: "Description is required" });

    const content = [];

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
      userid: req.id,
      desc: desc,
      content: content,
    });

    await Post.save();

    return res.status(200).json({ message: "OK", data: { post: Post } });
  }

  public async getUserPost(req: RequestWithUser, res: Response): Promise<any> {
    let userposts = await post.find({ userid: req.id });

    return res.json({ message: "OK", user: req.id, userposts: userposts });
  }

  public async getRandomPost(
    req: RequestWithUser,
    res: Response
  ): Promise<any> {
    post.aggregate([{ $sample: { size: 10 } }], function (err, result) {
      if (err) {
        return res.status(400).json({ message: err });
      }

      return res.json({ message: "OK", data: result });
    });
  }
}

export default new PostController();
