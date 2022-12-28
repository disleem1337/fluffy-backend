import express from "express";
import AuthRouter from "./auth/";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Api path");
});

router.use("/auth", AuthRouter);

export default router;
