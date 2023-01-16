import { NextFunction, Request, Response } from "express";
import jsonwebtoken from "jsonwebtoken";
import { RequestWithUser } from "../../types/requestWithUser";

export default async function Authorization(
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization;

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET) as any;

    const id = decoded.id;
    req.id = id;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
