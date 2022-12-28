import { Request, Response } from "express";

class AuthController {
  public async login(req: Request, res: Response): Promise<any> {
    return res.send("Login");
  }
}

export default new AuthController();
