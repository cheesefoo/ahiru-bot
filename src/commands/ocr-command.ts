import { Message } from 'discord.js-light';
import { LangCode } from '../models/enums';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { ApiUtils, MessageUtils } from '../utils';
import { Command } from './command';

let Config = require('../../config/config.json');

export class OCRCommand implements Command {
    public requireGuild = false;
    public requirePerms = [];

    public keyword(langCode: LangCode): string {
        return Lang.getRef('commands.ocr', langCode);
    }

    public regex(langCode: LangCode): RegExp {
        return Lang.getRegex('commands.ocr', langCode);
    }

    public async execute(msg: Message, args: string[], data: EventData): Promise<void> {
        let url = await MessageUtils.getUrl(msg, args);
        let detectedText: string;

        if (url === undefined) {
            if (args.length === 2) {
                await MessageUtils.send(
                    msg.channel,
                    Lang.getEmbed('displays.OCRHelp', data.lang())
                );
                return;
            }
            await MessageUtils.send(
                msg.channel,
                Lang.getEmbed('displays.ocrBadImage', data.lang())
            );
        } else {
            try {
                const result = await ApiUtils.OCRRequest(url);
                const errMsg = result?.error?.message;
                if (errMsg !== undefined) {
                    if (errMsg.startsWith('We can not access the URL currently)')) {
                        await MessageUtils.send(
                            msg.channel,
                            Lang.getEmbed('displays.OCRCanNotAccessUrl', data.lang())
                        );
                        return;
                    } else {
                        await MessageUtils.send(
                            msg.channel,
                            Lang.getEmbed('displays.OCRGenericError', data.lang(), {
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
