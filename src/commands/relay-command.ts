import { ApplicationCommandData, BaseCommandInteraction, Message, PermissionString } from 'discord.js';
import { HolodexApiClient } from 'holodex.js';
import { createRequire } from 'node:module';
import { LangCode } from '../models/enums';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { DatabaseUtils, MessageUtils } from '../utils';
import { Command, CommandDeferType } from './command';

const require = createRequire(import.meta.url);

let Config = require('../../config/config.json');

// let template = require("../../static/template.png");

export class RelayCommand implements Command
{
    public requireDev = false;
    public requireGuild = false;
    public requirePerms = ['KICK_MEMBERS'];
    private relayService;
    private holodexClient :HolodexApiClient;

    constructor(holodexClient, relayService)
    {
        this.holodexClient = holodexClient;
        this.relayService = relayService;
    }

    public keyword(langCode: LangCode): string
    {
        return Lang.getRef('commands.relay', langCode);
    }

    public regex(langCode: LangCode): RegExp
    {
        return Lang.getRegex('commandRegexes.relay', langCode);
    }

    deferType: CommandDeferType;
    metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.relay'),
        description: Lang.getRef('commandDescs.relay', Lang.Default),
        options: [{
            name: 'text',
            description: 'ur subtitle',
            type: 3,
            required: true,
        }],
    };
    requireClientPerms: PermissionString[] = [];
    requireUserPerms: PermissionString[] = [];

    public async execute(intr: BaseCommandInteraction, data: EventData): Promise<void>
    {


    }

    public async executeMessage(msg: Message, args: string[], data: EventData): Promise<void>
    {
        if (args.length === 2)
        {
            return;
        }

        let arg2 = args[2];
        if (arg2 === 'add')
        {
            let videoId = args[3];
            let holodexResp = await this.holodexClient.getLiveVideos({id:videoId,

            });
            if(holodexResp.length!=1){
                MessageUtils.send(msg.channel,`couldn't find \`${videoId}\` on holodex :(`);
                return;
            }
            this.relayService.setupLive(holodexResp[0]);
            let reply = `yes master...`
            if(msg.author.id == '614280577687748610' )
            {
                reply = '...はい、お兄ちゃん'
            }
            MessageUtils.send(msg.channel,reply);

        }

        if (arg2 === 'on')
        {
            await DatabaseUtils.SetRelaySetting(true);
        } else if (arg2 === 'off')
        {
            await DatabaseUtils.SetRelaySetting(false);
        } else
        {
            return;
        }
        await MessageUtils.send(msg.channel, `relay ${arg2}`);
    }


}
