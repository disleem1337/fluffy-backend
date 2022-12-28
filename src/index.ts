import { Logger } from "sitka";
import express from "express";
import cors from "cors";
import ApiRouter from "./api/routes";

const PORT = 3000;

class FluffyApp {
  private _logger: Logger;
  private _expressApp: express.Application;
  constructor() {
    this._logger = Logger.getLogger(this.constructor.name);
    this._setup();
  }

  private async _setup() {
    this._create();
    this._logger.info("Express app has been created");

    this._setupMiddlewares();
    this._logger.info("Middlewares have been setup");

    this._bindRoutes();
    this._logger.info("Routes have been bound");

    await this._listen();
    this._logger.info(`App is listening on port ${PORT}`);
  }

  private _create() {
    this._expressApp = express();
  }

  public _setupMiddlewares() {
    this._expressApp.use(express.json());
    this._expressApp.use(express.urlencoded({ extended: true }));
    this._expressApp.use(
      cors({
        origin: "*",
      })
    );
  }

  private _bindRoutes() {
    this._expressApp.use("/api", ApiRouter);
  }

  private _listen(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._expressApp.listen(PORT, () => {
        resolve();
      });
    });
  }
}

const app = new FluffyApp();
