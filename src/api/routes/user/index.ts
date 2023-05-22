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

router.get("/:id", Authorization, UserController.getUserById);

router.post("/:id/follow", Authorization, UserController.follow);
router.post("/:id/unfollow", Authorization, UserController.unfollow);

router.post("/stats", Authorization, UserController.getStats);

router.post("/allUser", Authorization, UserController.getAllUser);

router.post("/notifications", Authorization, UserController.getNotifications);

router.post("/otheruserstats", Authorization, UserController.getOtherStats);
export default router;
