import fetch, { HeaderInit } from 'node-fetch';
import { BotSite } from '../models/config-models';
import { HttpService, Lang, Logger } from '../services';
import { DatabaseUtils, MessageUtils, ShardUtils } from '../utils';
import { Job } from './job';

import { Channel, Client, Collection, Guild, GuildMember, TextChannel } from 'discord.js';
let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');

export class CheckInstagram implements Job {

    public name = 'Check Instagram';
    public schedule: string = Config.jobs.checkInstagram.schedule;
    public log: boolean = Config.jobs.checkInstagram.log; 
    private headers: HeaderInit = {
        Host: 'www.instagram.com',
        'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
    };
    // private username: string = 'subatomos';
    private username:string = 'oozorasubaru';

    private broadcastChannel = '825378176993722378';


    private url: string = `https://www.instagram.com/${this.username}/feed/?__a=1`;
    constructor(private client: Client) { }

    public async run(): Promise<void> {
        try {
            let res = await fetch(this.url, {
                method: 'get',
                headers: this.headers,
            });
            if (!res.ok) {
                throw res;
            }
            let json = await res.json();

            const shortcode = json["graphql"]["user"]["edge_owner_to_timeline_media"]["edges"][0]["node"]["shortcode"];
            if (await DatabaseUtils.CheckIfExists("INSTAGRAM", shortcode)) {
                Logger.info(Logs.info.instagram.replace('{SC}', shortcode));
            } else {
                await DatabaseUtils.Insert("INSTAGRAM", shortcode);
                let embed = await this.buildEmbed(json);
                let ch: TextChannel = this.client.channels.cache.get(this.broadcastChannel) as TextChannel;
                MessageUtils.send(ch, { embeds: [embed] });
            }
        } catch (error) {
            Logger.error(Logs.error.job.replace('{JOB}', 'CheckInstagram'), error);
        }

        Logger.info(Logs.info.jobCompleted.replace('{JOB}', 'CheckInstagram'));
    }

    public async buildEmbed(json) {

        // console.log("json\n");
        // console.log(json);
        let node = json["graphql"]["user"]["edge_owner_to_timeline_media"]["edges"][0]["node"];
        let pfp = json["graphql"]["user"]["profile_pic_url_hd"];
        // console.log("node\n");
        // console.log(node);
        let url = node["shortcode"]
        let desc = node["edge_media_to_caption"]["edges"][0]?.node?.["text"];
        let embed = {
            color: 0xec054c,
            title: `New post from @${this.username}`,
            url: `https://www.instagram.com/p/${url}/`,

            description: desc ?? "",
            image: { "url": node["thumbnail_src"] },
            thumbnail: {
                "url": pfp
            }
        };
        return embed;

    }
}
