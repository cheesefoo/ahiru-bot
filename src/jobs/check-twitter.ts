// const Twitter = require('twitter-v2');
import Twitter from 'twitter-v2';
import fetch, { HeaderInit, Response } from 'node-fetch';
import { BotSite } from '../models/config-models';
import { HttpService, Lang, Logger } from '../services';
import { MessageUtils, ShardUtils, DatabaseUtils } from '../utils';
import { Job } from './job';

import { Channel, Client, Collection, Guild, GuildMember, TextChannel } from 'discord.js';
let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');
let baseEndpoint = "https://api.twitter.com/2/spaces/search"
// let testId = '1449090654542434308'
let testId = '790344487'
let subaId = '1027853566780698624'
export class CheckTwitter implements Job {
  public name = 'Check Twitter';
  public schedule: string = Config.jobs.checkTwitter.schedule;
  public log: boolean = Config.jobs.checkTwitter.log;

  constructor(private client: Client) { }

  private broadcastChannel = '825378176993722378';

  public async run(): Promise<void> {
    await this.Check();
  }

  private async Check() {
    let twitter = new Twitter({
      bearer_token: process.env.twitter_token
    });
    let endPt = `https://api.twitter.com/2/spaces/by/creator_ids?user_ids=${testId}`;
    let res = await twitter.get<Response>("spaces/by/creator_ids", { user_ids: testId });
    // console.log(res);
    if (res["meta"]["result_count"] == 0) {
      // console.log("No space found")
      //Logger.info(Logs.info.jobCompleted.replace('{JOB}', 'CheckSpaces'));

      // return;
    } else {
      let spaceId = res["data"][0].id;
      try {
        if (await DatabaseUtils.CheckIfExists("SPACES", spaceId)) {
          Logger.info(Logs.info.spaces.replace('{SC}', spaceId));
        } else {
          await DatabaseUtils.Insert("SPACES", spaceId);
          let embed = await this.buildEmbed(spaceId);
          let ch: TextChannel = this.client.channels.cache.get(this.broadcastChannel) as TextChannel;
          MessageUtils.send(ch, { embeds: [embed] });
        }
      } catch (error) {
        Logger.error(Logs.error.job.replace('{JOB}', 'CheckTwitter'), error);
      }
    }
    Logger.info(Logs.info.jobCompleted.replace('{JOB}', 'CheckTwitter'));
  }

  private async buildEmbed(spaceId) {
    let listenUrl = `https://twitter.com/i/spaces/${spaceId}`
    console.log(listenUrl);

    let embed = {
      color: 0x1DA1F2,

      title: `Subaru Twitter Space started!`,
      url: listenUrl,
    }
    return embed;
  }
}
