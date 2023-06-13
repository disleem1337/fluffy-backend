import { Response } from "express";
import Notification from "../../models/notification";
import { RequestWithUser } from "../../types/requestWithUser";
import mongoose from "mongoose";

class NotificationController {
  async getAll(req: RequestWithUser, res: Response) {
    const seen = req.query.seen;


    const notifications = await Notification.find({
      destinationUser:new mongoose.Types.ObjectId(req.id),
      ...(seen != undefined ? { seen } : {}),
    });



    return res.status(200).json({
      message: "OK",
      data: notifications,
    });
  }

  async seeNotification(req: RequestWithUser, res: Response) {
    const id = req.params.id;

    const notificationToSee = await Notification.findById(id);

    if (!notificationToSee)
      return res.status(404).json({
        message: "Couldn't find notification",
      });

    notificationToSee.seen = true;
    await notificationToSee.save();

    return res.json({
      message: "OK",
    });
  }
}

export default new NotificationController();
