import { ApplicationCommandData, CommandInteraction, Message } from 'discord.js';
import { LangCode } from '../models/enums';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { ApiUtils, MessageUtils } from '../utils';
import { Command } from './command';
import { MessageCommand } from './messageCommand';

let Config = require('../../config/config.json');

export class OCRCommand implements Command,MessageCommand {
    public data: ApplicationCommandData = {
        name: Lang.getCom('commands.ocr'),
        description: Lang.getRef('commandDescs.ocr', Lang.Default),
    };
    public requireDev = false;
    public requireGuild = false;
    public requirePerms = [];

    public keyword(langCode: LangCode): string {
        return Lang.getRef('commands.ocr', langCode);
    }

    public regex(langCode: LangCode): RegExp {
        return Lang.getRegex('commandRegexes.ocr', langCode);
    }
    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        await MessageUtils.sendIntr(intr, Lang.getEmbed('displayEmbeds.test', data.lang()));
    }
    public async executeMessageCommand(msg: Message, args: string[], data: EventData): Promise<void> {
        let url = await MessageUtils.getUrl(msg, args);
        let detectedText: string;

        if (url === undefined) {
            if (args.length === 2) {
                await MessageUtils.send(
                    msg.channel,
                    Lang.getEmbed('displayEmbeds.OCRHelp', data.lang())
                );
                return;
            }
            await MessageUtils.send(
                msg.channel,
                Lang.getEmbed('displayEmbeds.ocrBadImage', data.lang())
            );
        } else {
            try {
                const result = await ApiUtils.OCRRequest(url);
                const errMsg = result?.error?.message;
                if (errMsg !== undefined) {
                    if (errMsg.startsWith('We can not access the URL currently)')) {
                        await MessageUtils.send(
                            msg.channel,
                            Lang.getEmbed('displayEmbeds.OCRCanNotAccessUrl', data.lang())
                        );
                        return;
                    } else {
                        await MessageUtils.send(
                            msg.channel,
                            Lang.getEmbed('displayEmbeds.OCRGenericError', data.lang(), {
                                ERROR: errMsg,
                            })
                        );
                        return;
                    }
                }
                const detections = result.fullTextAnnotation;

                detectedText = detections.text;
                console.log(detectedText);
                await MessageUtils.send(msg.channel, `\`\`\`${detectedText}\`\`\``);
            } catch (err) {
                console.log(err);
                await MessageUtils.send(msg.channel, err);
            }
        }
    }
}
