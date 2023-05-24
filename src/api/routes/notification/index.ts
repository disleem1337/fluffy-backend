import express from "express";
import NotificationController from "../../controllers/notification";

const router = express.Router();

router.get("/", NotificationController.getAll);
router.post("/:id/see", NotificationController.seeNotification);

export default router;
