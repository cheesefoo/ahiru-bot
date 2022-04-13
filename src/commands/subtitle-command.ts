import Canvas from 'canvas';
import {
    ApplicationCommandData,
    BaseCommandInteraction,
    CommandInteraction,
    Message,
    MessageAttachment,
    PermissionString,
} from 'discord.js';
import { createRequire } from 'node:module';
import { LangCode } from '../models/enums';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { InteractionUtils, MessageUtils } from '../utils';
import { CanvasUtils } from '../utils/canvas-utils';
import { Command, CommandDeferType } from './command';

const require = createRequire(import.meta.url);

let Config = require('../../config/config.json');

// let template = require("../../static/template.png");

export class SubtitleCommand implements Command {
    public requireDev = false;
    public requireGuild = false;
    public requirePerms = [];

    public keyword(langCode: LangCode): string {
        return Lang.getRef('commands.subtitle', langCode);
    }

    public regex(langCode: LangCode): RegExp {
        return Lang.getRegex('commandRegexes.subtitle', langCode);
    }

    deferType: CommandDeferType;
    metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.subtitle'),
        description: Lang.getRef('commandDescs.subtitle', Lang.Default),
        options: [
            {
                name: 'text',
                description: 'ur subtitle',
                type: 3,
                required: true,
            },
        ],
    };
    requireClientPerms: PermissionString[] = [];
    requireUserPerms: PermissionString[] = [];

    public async execute(intr: BaseCommandInteraction, data: EventData): Promise<void> {
        await intr.deferReply();
        let cmd = intr as CommandInteraction;
        let text = cmd.options.getString('text');
        if (text.length > 50) {
            await InteractionUtils.send(intr, 'sentence too long lol', true);
            return;
        } else {
            let template =
                'https://cdn.discordapp.com/attachments/825378176993722378/901942196293492836/template.png';
            let attachment = await CanvasUtils.OverlayText(template, text);
            await InteractionUtils.send(intr, { attachments: [attachment] });
            return;
        }
    }

    public async executeMessage(msg: Message, args: string[], data: EventData): Promise<void> {
        let template, text: string;
        let x, y, fontSize, lineWidth: number;
        if (args.length === 2) {
            await MessageUtils.send(
                msg.channel,
                Lang.getEmbed('displayEmbeds.subtitleHelp', data.lang())
            );
            return;
        }
        console.log(args[1].toString());
        switch (args[1]) {
            case 'fist':
            case 'arthur': {
                template =
                    'https://cdn.discordapp.com/attachments/870361524789723187/902359723809075231/template2.png';
                x = 499;
                y = 433;
                fontSize = 24;
                lineWidth = 3;
                break;
            }
            case 'think':
            default: {
                template =
                    'https://cdn.discordapp.com/attachments/825378176993722378/901942196293492836/template.png';
                x = 1920;
                y = 1080;
                fontSize = 100;
                lineWidth = 8;
                break;
            }
        }
        text = args.slice(2).reduce((prev, cur, _index, _array) => {
            return prev + ' ' + cur;
        });
        if (text.length > 50) {
            await MessageUtils.send(msg.channel, 'sentence too long lol');
            return;
        }

        const attachment = await CanvasUtils.OverlayText(template, text, x, y, fontSize, lineWidth);

        await MessageUtils.send(msg.channel, { files: [attachment] });
    }
}
