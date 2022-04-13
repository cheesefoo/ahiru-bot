import { ApplicationCommandData, CommandInteraction, Message, PermissionString } from 'discord.js';
import { LangCode } from '../models/enums';

import { EventData } from '../models/internal-models.js';
import { Lang } from '../services/index.js';

import { MessageUtils } from '../utils';
import { InteractionUtils } from '../utils/index.js';
import { Command, CommandDeferType } from './index.js';

export class HelpCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.help'),
        description: Lang.getRef('commandDescs.help', Lang.Default),
    };
    public deferType = CommandDeferType.PUBLIC;
    public requireDev = false;
    public requireGuild = false;
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];
    public requirePerms = [];

    public keyword(langCode: LangCode): string {
        return Lang.getRef('commands.help', langCode);
    }

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        await InteractionUtils.send(intr, Lang.getEmbed('displayEmbeds.help', data.lang()));
    }

    public regex(langCode: LangCode): RegExp {
        return Lang.getRegex('commandRegexes.help', langCode);
    }

    public async executeMessage(msg: Message, args: string[], data: EventData): Promise<void> {
        await MessageUtils.send(msg.channel, Lang.getEmbed('displayEmbeds.help', data.lang()));
    }
}
