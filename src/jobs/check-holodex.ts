import { Client } from 'discord.js';
import { HolodexApiClient, Video } from 'holodex.js';
import { createRequire } from 'node:module';
import { Relay } from '../services/relay';
import { Job } from './job';

const require = createRequire(import.meta.url);

let Config = require('../../config/config.json');

export class CheckHolodex implements Job
{
    public name = 'Check Holodex';
    public schedule: string = Config.jobs.checkHolodex.schedule;
    public log: boolean = Config.jobs.checkHolodex.log;

    public holodexClient;
    public relayService;
    private checkedVideos: Video[];
    private subbedVideos: Video[];

    constructor(private client: Client,holodexClient,relayService)
    {
        this.holodexClient = holodexClient;
        this.relayService = relayService;
    }




    public async run(): Promise<void>
    {
        await this.GetHolodex();
    }

    private async GetHolodex()
    {
        const lives: Video[] = await this.holodexClient.getLiveVideos({
            channel_id:'UCvzGlP9oQwU--Y0r9id_jnA',
            max_upcoming_hours: 1,
        });
        for (const live of lives)
        {
            const videoId = live.videoId;
            if (!videoId) continue;



                if (!this.relayService.subscribedVideos.includes(videoId))
                {
                    await this.relayService.setupLive(live);
                }
        }
    }
}
