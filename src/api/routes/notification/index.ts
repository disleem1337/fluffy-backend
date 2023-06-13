import express from "express";
import NotificationController from "../../controllers/notification";
import Authorization from "../../middlewares/authorization";

const router = express.Router();

router.get("/", Authorization,NotificationController.getAll);
router.post("/:id/see", Authorization,NotificationController.seeNotification);

export default router;
