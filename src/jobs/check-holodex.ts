import { Client } from 'discord.js';
import { HolodexApiClient } from 'holodex.js';
import { createRequire } from 'node:module';
import { stringify } from 'querystring';
import { Relay } from '../models/holodex/relay';
import { Job } from './job';
const require = createRequire(import.meta.url);

let Config = require('../../config/config.json');
import { Logger } from '../services';

export class CheckHolodex implements Job
{

    public name = 'Check Holodex';
    public schedule: string = Config.jobs.checkHolodex.schedule;
    public log: boolean = Config.jobs.checkHolodex.log;

    private holoapi;
    private relay;

    constructor(private client: Client) {

        this.holoapi = new HolodexApiClient({
            apiKey: process.env.holodex_api,
        });
        this.relay = new Relay(client)
    }

    public async run(): Promise<void>
    {
        await this.Check();
    }


    private async Check()
    {
        const lives = await this.holoapi.getLiveVideos({
            // channel_id: 'UChAnqc_AY5_I3Px5dig3X1Q',
            // channel_id: 'UCvzGlP9oQwU--Y0r9id_jnA',
            org:'Hololive',
            max_upcoming_hours: 1,
        });
        for (const live of lives)
        {
            const videoId = live.videoId;
            if (!videoId) continue;
            if (!this.relay.subscribedVideos.includes(videoId))
            {
                await this.relay.setupLive(live);
            }
        }
    }
}
