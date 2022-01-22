import { Client, TextChannel } from 'discord.js';
import { Request, Response, Router } from 'express';
import router from 'express-promise-router';
import { MessageUtils } from '../utils';

import { Controller } from './controller';

export class WebhookEndpoint implements Controller {
    public path = '/hook';
    public router: Router = router();

    constructor(private client: Client) {}
    private broadcastCh = '923726316333850635';
    // private mem = '764841347273195580'
    // private broadcastCh = '825378176993722378';
    // private  broadcastCh = '722257568361087057';

    public register(): void {
        this.router.get('/', (req, res) => this.get(req, res));
        this.router.post('/', (req, res) => this.post(req, res));
    }

    private async get(req: Request, res: Response): Promise<void> {
        res.status(200).json({ message: 'hi' });
    }
    private async post(req: Request, res: Response): Promise<void> {
        let body: string = req.body.message;
        console.log(body);
        let ch: TextChannel = this.client.channels.cache.get(this.broadcastCh) as TextChannel;
        const emoji = this.client.emojis.cache.find(e => e.name === 'd_');
        await MessageUtils.send(ch, `${emoji}:${body}`);
        res.status(200).end(); // Responding is important
    }
}