import express from "express";
import AuthRouter from "./auth/";
import UserRouter from "./user/";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Api path");
});

router.use("/auth", AuthRouter);
router.use("/user", UserRouter);

export default router;
