import fetch, { HeaderInit } from 'node-fetch';
import { BotSite } from '../models/config-models';
import { HttpService, Lang, Logger } from '../services';
import { ShardUtils } from '../utils';
import { Job } from './job';

import { Client, Collection, Guild, GuildMember } from 'discord.js';
let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');

export class CheckInstagram implements Job {

    public name = 'Update Server Count';
    public schedule: string = Config.jobs.updateServerCount.schedule;
    public log: boolean = Config.jobs.updateServerCount.log;
    private lastImageId: string;
    private botSites: BotSite[];
    private headers: HeaderInit = {
        Host: 'www.instagram.com',
        'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
    };
    private username: string = 'subatomos';
    // private username:string = 'oozorasubaru';

    private broadcastChannel = '825378176993722378';


    private url: string = `https://www.instagram.com/${this.username}/feed/?__a=1`;
    constructor(private httpService: HttpService, private client: Client) { }

    public async run(client): Promise<void> {
        try {
            let res = await fetch(this.url, {
                method: 'get',
                headers: this.headers,
            });
            if (!res.ok) {
                throw res;
            }
            let embed = await this.buildEmbed(res);
            let ch = client.channels.cache.get(this.broadcastChannel);
            ch.send({ embeds: [embed] });
        } catch (error) {
            Logger.error(Logs.error.job.replace('{JOB}', 'CheckInstagram'), error);
        }

        Logger.info(Logs.info.jobCompleted.replace('{JOB}', 'CheckInstagram'));
    }

    public async buildEmbed(res) {
        console.log("res\n");
        console.log(res);
        let url = await this.get_last_publication_url(res);
        let embed = {
            color: 0xec054c,
            title: `New post from @${this.username}`,
            url: `https://www.instagram.com/p/${url}/`,

            description: this.get_description_photo(res),
            image: { "url": this.get_last_thumb_url(res) },
            thumbnail: {
                "url": this.get_last_thumb_url(res)
            }
        };
        return embed;

    }

    public get_user_fullname(html) {
        return html.json()["graphql"]["user"]["full_name"]
    }


    public get_total_photos(html): Number {
        return html.json()["graphql"]["user"]["edge_owner_to_timeline_media"]["count"]
    }


    public async get_last_publication_url(html) {
        let json = html.json();
        console.log("json\n");
        console.log(json);
        let json2 = json["graphql"]["user"]["edge_owner_to_timeline_media"]["edges"][0]["node"]["shortcode"];
        console.log("json2\n");
        console.log(json2);
        return json;
    }


    public get_last_photo_url(html) {
        return html.json()["graphql"]["user"]["edge_owner_to_timeline_media"]["edges"][0]["node"]["display_url"]
    }


    public get_last_thumb_url(html) {
        return html.json()["graphql"]["user"]["edge_owner_to_timeline_media"]["edges"][0]["node"]["thumbnail_src"]
    }


    public get_description_photo(html) {
        return html.json()["graphql"]["user"]["edge_owner_to_timeline_media"]["edges"][0]["node"]["edge_media_to_caption"]["edges"][0]["node"]["text"]
    }

}
