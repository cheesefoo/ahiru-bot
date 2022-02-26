import { Client } from 'discord.js';
import { HolodexApiClient } from 'holodex.js';
import { createRequire } from 'node:module';
import { Relay } from '../models/holodex/relay';
import { DatabaseUtils } from '../utils';
import { Job } from './job';

const require = createRequire(import.meta.url);

let Config = require('../../config/config.json');

export class CheckHolodex implements Job
{

    public name = 'Check Holodex';
    public schedule: string = Config.jobs.checkHolodex.schedule;
    public log: boolean = Config.jobs.checkHolodex.log;

    private holoapi;
    public relay;
    private lastCheck = true;

    constructor(private client: Client)
    {

        this.holoapi = new HolodexApiClient({
            apiKey: process.env.holodex_api,
        });
        this.relay = new Relay(client);
    }

    public async run(): Promise<void>
    {
/*        let shouldCheck = await DatabaseUtils.GetRelaySetting();
        //gheto as fuk
        if (shouldCheck == false && shouldCheck != this.lastCheck)
        {
            this.relay.tldex.off();
        }
        if (shouldCheck)
        {
            await this.Check();
        }
        this.lastCheck = shouldCheck;*/
        await this.Check();

    }


    private async Check()
    {
        const lives = await this.holoapi.getLiveVideos({
            // channel_id: 'UCgmPnx-EEeOrZSg5Tiw7ZRQ',
            channel_id: 'UCvzGlP9oQwU--Y0r9id_jnA',
            // org:'Hololive',
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
