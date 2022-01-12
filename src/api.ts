import bodyParser from 'body-parser';
import express, { Express } from 'express';

import util from 'util';

import { Controller } from './controllers';
import { checkAuth, handleError } from './middleware';
import { Logger } from './services';

let Config = require('../config/config.json');
let Logs = require('../lang/logs.json');

export class Api {
    private app: Express;

    constructor(public controllers: Controller[]) {
        this.app = express();
        this.app.use(express.json());
        // this.app.use(bodyParser.urlencoded({ extended: false }));
        // this.app.use(bodyParser.json());
        this.setupControllers();
        this.app.use(handleError());
    }

    public async start(): Promise<void> {
        let listen = util.promisify(this.app.listen.bind(this.app));
        let port = process.env.PORT;
        await listen(port);
        Logger.info(Logs.info.apiStarted.replaceAll('{PORT}', port));
    }

    private setupControllers(): void {
        for (let controller of this.controllers) {
            if (controller.authToken) {
                controller.router.use(checkAuth(controller.authToken));
            }
            controller.register();
            this.app.use(controller.path, controller.router);
        }
    }
}
