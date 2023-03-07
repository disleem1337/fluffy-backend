import express from "express";
import UserController from "../../controllers/user";
import Authorization from "../../middlewares/authorization";

const router = express.Router();

router.get("/me", Authorization, UserController.me);
router.post("/setup", Authorization, UserController.setup);


export default router;
