import { Client, TextChannel } from 'discord.js';
import { Request, Response, Router } from 'express';
import router from 'express-promise-router';
import { MessageUtils } from '../utils';

import { Controller } from './controller';

export class WebhookEndpoint implements Controller {
    public path = '/hook';
    public router: Router = router();

    constructor(private client: Client) {}

    // private broadcastCh = '945888571619934240';
    //private broadcastCh = '945888571619934240'; // aaaaaa
    // private mem = '764841347273195580'
    // private broadcastCh = '825378176993722378';
    private  broadcastCh = '722257568361087057'; //stream-chat

    public register(): void {
        this.router.get('/', (req, res) => this.get(req, res));
        this.router.post('/', (req, res) => this.post(req, res));
    }

    private async get(req: Request, res: Response): Promise<void> {
        res.status(200).json({ message: 'hi' });
    }
    private async post(req: Request, res: Response): Promise<void> {
        let body = req.body;
        let time = body.timestampUsec.substring(0,10);
        let author = body.authorName;
        let message = body.message[0].text;
        console.log(body);
        let ch: TextChannel = this.client.channels.cache.get(this.broadcastCh) as TextChannel;
        // const emoji = this.client.emojis.cache.find(e => e.name === 'd_');
        await MessageUtils.send(ch, `<t:${time}:T> ${author}:${message}`);
        res.status(204) // Responding is important
    }
    private adjustForTimezone(d:Date, offset:number):Date{
        const date = d.toISOString();
        const targetTime = new Date(date);
         //time zone value from database
        //get the timezone offset from local time in minutes
        const tzDifference = offset * 60 + targetTime.getTimezoneOffset();
        //convert the offset to milliseconds, add to targetTime, and make a new Date
        return new Date(targetTime.getTime() + tzDifference * 60 * 1000);
    }
}
