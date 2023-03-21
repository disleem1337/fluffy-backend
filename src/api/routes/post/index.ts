import express from "express";
import multer from "multer";
import PostController from "../../controllers/post";
import Authorization from "../../middlewares/authorization";

const router = express.Router();

router.post(
  "/",
  Authorization,
  multer({
    limits: {
      fileSize: 1024 * 1024 * 4,
    },
  }).fields([{ name: "images" }, { name: "video" }]),
  PostController.CreatePost
);

router.get("/", Authorization, PostController.getUserPost);

router.get("/feed", Authorization, PostController.getFeed);

router.post("/like", Authorization, PostController.likePost);

router.post("/unlike", Authorization, PostController.unlikePost);

router.post("/comment", Authorization, PostController.commentPost);

router.delete("/comment", Authorization, PostController.deleteComment);

export default router;
