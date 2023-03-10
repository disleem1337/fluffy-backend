import express from "express";
import multer from "multer";
import UserController from "../../controllers/user";
import Authorization from "../../middlewares/authorization";

const router = express.Router();

router.get("/me", Authorization, UserController.me);
router.post(
  "/setup",
  Authorization,
  multer({
    limits: {
      fileSize: 1024 * 1024 * 4,
    },
  }).single("image"),
  UserController.setup
);

export default router;
