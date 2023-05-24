import express from "express";
import AuthRouter from "./auth/";
import UserRouter from "./user/";
import PostRouter from "./post/";
import NotificationRouter from "./notification";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Api path");
});

router.use("/auth", AuthRouter);
router.use("/user", UserRouter);
router.use("/post", PostRouter);
router.use("/notification", NotificationRouter);

export default router;
