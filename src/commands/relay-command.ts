import {
    ApplicationCommandData,
    BaseCommandInteraction,
    CommandInteraction,
    Message,
    PermissionString,
} from 'discord.js';
import { createRequire } from 'node:module';
import { LangCode } from '../models/enums';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { DatabaseUtils, InteractionUtils, MessageUtils } from '../utils';
import { Command, CommandDeferType } from './command';

const require = createRequire(import.meta.url);

let Config = require('../../config/config.json');

// let template = require("../../static/template.png");

export class RelayCommand implements Command
{
    public requireDev = false;
    public requireGuild = false;
    public requirePerms = ['KICK_MEMBERS'];

    public keyword(langCode: LangCode): string
    {
        return Lang.getRef('commands.relay', langCode);
    }

    public regex(langCode: LangCode): RegExp
    {
        return Lang.getRegex('commandRegexes.relay', langCode);
    }

    deferType: CommandDeferType;
    metadata: ApplicationCommandData         ={
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


        let setting = args[2];
        if (setting === 'on')
        {
            await DatabaseUtils.SetRelaySetting(true);
        } else if (setting === 'off')
        {
            await DatabaseUtils.SetRelaySetting(false);
        } else
        {
            return;
        }
        await MessageUtils.send(msg.channel, `relay ${setting}`);
    }


}
