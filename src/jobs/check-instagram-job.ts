import { ActivityType, ShardingManager } from 'discord.js-light';

import { BotSite } from '../models/config-models';
import { HttpService, Lang, Logger } from '../services';
import { ShardUtils } from '../utils';
import { Job } from './job';

let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');

export class CheckInstagram implements Job {
    public name = 'Update Server Count';
    public schedule: string = Config.jobs.updateServerCount.schedule;
    public log: boolean = Config.jobs.updateServerCount.log;
    private lastImageId: string;
    private botSites: BotSite[];
    private headers = {
        "Host": "www.instagram.com",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11"
    }
    private username: string = 'subatomoen';
    // private username:string = 'oozorasubaru';

    private url: string = `https://www.instagram.com/${this.username}/feed/?__a=1`;

    //pleiades = 831379672431329330
    //venndiagram = 870361524789723187
    private starboardChannel = '831379672431329330';

    constructor(private httpService: HttpService) {

    }

    public async run(): Promise<void> {
        try {
            let res = await this.httpService.get(this.url, null, this.headers);
            if (!res.ok) {
                throw res;
            }
            // await sendInsta(res);
        } catch (error) {
            Logger.error(
                Logs.error.job.replace('{JOB}', 'CheckInstagram'),
                error
            );

        }

        Logger.info(Logs.info.jobCompleted.replace('{JOB}', 'CheckInstagram'));
    }
    public async sendInsta(res) {

    }

    /*
    
def get_user_fullname(html):
    return html.json()["graphql"]["user"]["full_name"]


def get_total_photos(html):
    return int(html.json()["graphql"]["user"]["edge_owner_to_timeline_media"]["count"])


def get_last_publication_url(html):
    return html.json()["graphql"]["user"]["edge_owner_to_timeline_media"]["edges"][0]["node"]["shortcode"]


def get_last_photo_url(html):
    return html.json()["graphql"]["user"]["edge_owner_to_timeline_media"]["edges"][0]["node"]["display_url"]


def get_last_thumb_url(html):
    return html.json()["graphql"]["user"]["edge_owner_to_timeline_media"]["edges"][0]["node"]["thumbnail_src"]


def get_description_photo(html):
    return html.json()["graphql"]["user"]["edge_owner_to_timeline_media"]["edges"][0]["node"]["edge_media_to_caption"]["edges"][0]["node"]["text"]

    */
}


