import { Request, Response } from "express";
import { utils } from "ethers";
import User from "../../models/user";
import Joi from "joi";
import { RequestWithUser } from "../../types/requestWithUser";

const setupSchema = Joi.object({
  name: Joi.string().alphanum().required().min(3).max(64),
  username: Joi.string().alphanum().required().min(3).max(64),
  email: Joi.string().email().required(),
});

class UserController {
  public async me(req: RequestWithUser, res: Response): Promise<any> {
    const user = await User.findById(req.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ message: "OK", user });
  }

  public async setup(req: RequestWithUser, res: Response): Promise<any> {
    const { name, username, email } = req.body;

    const { error } = setupSchema.validate({ name, username, email });

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const user = await User.findById(req.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.setup) {
      return res.status(400).json({ message: "User already setup" });
    }

    const userWithSameUsername = await User.findOne({
      username: username.toLowerCase(),
    });

    if (userWithSameUsername) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const userWithSameEmail = await User.findOne({
      email: email.toLowerCase(),
    });

    if (userWithSameEmail) {
      return res.status(400).json({ message: "Email already taken" });
    }

    user.name = name;
    user.username = username;
    user.email = email.toLowerCase();
    user.setup = true;

    await user.save();

    return res.status(200).json({ message: "OK" });
  }
}

export default new UserController();
