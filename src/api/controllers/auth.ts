import { Request, Response } from "express";
import { utils } from "ethers";

class AuthController {
  public async login(req: Request, res: Response): Promise<any> {
    const { account, signedMessage } = req.body;

    if (!account || !signedMessage) {
      return res.status(400).send("Bad request");
    }

    let verified = false;

    try {
      const messageAddress = utils.verifyMessage("fluffy", signedMessage);
      if (messageAddress === account) {
        verified = true;
      }
    } catch (err) {}

    if (!verified) return res.status(401).send("Unauthorized");

    return res.status(200).send("OK");
  }
}

export default new AuthController();
