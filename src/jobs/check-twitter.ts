// const Twitter = require('twitter-v2');
import { createRequire } from 'node:module';
import Twitter from 'twitter-v2';
import { Response } from 'node-fetch';
import { Logger } from '../services';
import { MessageUtils, DatabaseUtils } from '../utils';
import { Job } from './job';

import { Client, TextChannel, User } from 'discord.js';
import { TwitterSpaceUtils } from '../utils/twitter-space-utils';
const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');
let baseEndpoint = 'https://api.twitter.com/2/spaces/search';
// let testId = '1449090654542434308'
let testId = '313289241';
let subaId = '1027853566780698624';
let uimamaId = '69496975';
let broadcastChannel = '722257568361087057';
let broadcastChannel2 = '825378176993722378';
let checks = [
    [subaId, broadcastChannel],
    // [uimamaId, broadcastChannel2],
];
export class CheckTwitter implements Job {
    public name = 'Check Twitter';
    public schedule: string = Config.jobs.checkTwitter.schedule;
    public log: boolean = Config.jobs.checkTwitter.log;

    constructor(private client: Client) {}
    //subastream

    //test
    // private broadcastChannel = '825378176993722378';

    public async run(): Promise<void> {
        await this.Check();
    }

    private async Check() {
        let twitter = new Twitter({
            bearer_token: process.env.twitter_token,
        });

        checks.forEach(async ([id, channel]) => {
            let endPt = `https://api.twitter.com/2/spaces/by/creator_ids?user_ids=${id}`;
            let res = await twitter.get<Response>('spaces/by/creator_ids', { user_ids: id });

            //There is a live space
            if (res['meta']['result_count'] != 0) {
                let spaceId = res['data'][0].id;
                let state = res['data'][0].state;
                try {
                    //Check if we've seen it already
                    if (await DatabaseUtils.CheckIfExists('SPACES', spaceId)) {
                        Logger.trace(Logs.info.spacesold.replace('{SC}', spaceId));
                    } else {
                        //New, post to discord
                        let embed = await this.buildEmbed(spaceId);
                        let ch: TextChannel = this.client.channels.cache.get(
                            channel
                        ) as TextChannel;
                        await MessageUtils.send(ch, { embeds: [embed] });
                        let metadata = await TwitterSpaceUtils.GetMetadata(spaceId);
                        let url = await TwitterSpaceUtils.GetURL(metadata);
                        let user: User = this.client.users.cache.get('118387143952302083');
                        await MessageUtils.send(user, '@venndiagram#7498\n' + '`' + url + '`');

                        await DatabaseUtils.Insert('SPACES', spaceId, url.toString());
                    }
                } catch (error) {
                    Logger.error(Logs.error.job.replace('{JOB}', 'CheckTwitter'), error);
                }
            } else {
                Logger.trace(Logs.info.nospace);
            }
        });
        Logger.trace(Logs.info.jobCompleted.replace('{JOB}', 'CheckTwitter'));
    }

    private async buildEmbed(spaceId) {
        let listenUrl = `https://twitter.com/i/spaces/${spaceId}`;
        console.log(listenUrl);

        let embed = {
            color: 0x1da1f2,

            title: `Subaru Twitter Space started! (auto-recording NYI)`,
            url: listenUrl,
        };
        return embed;
    }
}
