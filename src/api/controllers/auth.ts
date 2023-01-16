import { Request, Response } from "express";
import { utils } from "ethers";
import jsonwebtoken from "jsonwebtoken";
import User from "../../models/user";

class AuthController {
  public async login(req: Request, res: Response): Promise<any> {
    const { account, signedMessage } = req.body;

    if (!account || !signedMessage) {
      return res.status(400).send("Bad request");
    }

    let verified = false;

    try {
      const messageAddress = utils.verifyMessage("fluffy", signedMessage);
      if (messageAddress.toLowerCase() === account.toLowerCase()) {
        verified = true;
      }
    } catch (err) {}

    if (!verified) return res.status(401).send("Unauthorized");

    // TODO: Check if user exists in database

    const user = await User.findOne({ walletAddress: account.toLowerCase() });

    if (!user) {
      const newUser = new User({
        walletAddress: account.toLowerCase(),
      });
      await newUser.save();

      const token = jsonwebtoken.sign(
        { id: newUser._id },
        process.env.JWT_SECRET
      );

      return res.status(200).json({ message: "OK", token });
    } else {
      const token = jsonwebtoken.sign({ id: user._id }, process.env.JWT_SECRET);

      return res.status(200).json({ message: "OK", token });
    }
  }
}

export default new AuthController();
