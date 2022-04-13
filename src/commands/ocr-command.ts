import {
    ApplicationCommandData,
    Collection,
    Message,
    MessageContextMenuInteraction,
    PermissionString,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';
import { createRequire } from 'node:module';
import { LangCode } from '../models/enums';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { ApiUtils, InteractionUtils, MessageUtils } from '../utils';
import { Command, CommandDeferType } from './command';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');

export class OCRCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.ocr'),
        type: 3,
        // description: Lang.getRef('commandDescs.ocr', Lang.Default),
    };
    public requireDev = false;
    public requireGuild = false;
    public requirePerms = [];
    cooldown?: RateLimiter;
    deferType: CommandDeferType;
    requireClientPerms: PermissionString[] = [];
    requireUserPerms: PermissionString[] = [];

    public keyword(langCode: LangCode): string {
        return Lang.getRef('commands.ocr', langCode);
    }

    public regex(langCode: LangCode): RegExp {
        return Lang.getRegex('commandRegexes.ocr', langCode);
    }

    public async execute(intr: MessageContextMenuInteraction, data: EventData): Promise<void> {
        // throw new Error('Method not implemented.');

        await intr.deferReply();
        let attachments = intr.targetMessage.attachments;
        let len: number = attachments instanceof Collection ? attachments.size : attachments.length;
        if (len !== 1) {
            await InteractionUtils.send(
                intr,
                MessageUtils.messageOptions(Lang.getEmbed('displayEmbeds.OCRNoImage', data.lang())),
                true
            );
            return;
        }
        let url =
            attachments instanceof Collection
                ? attachments.first().url
                : attachments.entries()[0].url;
        try {
            let text = await ApiUtils.OCRRequest(url);
            if (text != undefined) {
                await InteractionUtils.send(intr, text, false);
                return;
            } else {
                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('displayEmbeds.OCRNoTextDetected', data.lang()),
                    true
                );
            }
        } catch (errMsg) {
            console.log(errMsg);
            if (errMsg.startsWith('We can not access the URL currently)')) {
                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('displayEmbeds.OCRCanNotAccessUrl', data.lang()),
                    true
                );
                return;
            } else {
                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('displayEmbeds.OCRGenericError', data.lang(), {
                        ERROR: errMsg,
                    }),
                    true
                );
                return;
            }
        }
    }

    public async executeMessage(msg: Message, args: string[], data: EventData): Promise<void> {
        let url = await MessageUtils.getUrl(msg, args);

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
                const detectedText = await ApiUtils.OCRRequest(url);
                console.log(detectedText);
                if (detectedText == undefined) {
                    await MessageUtils.send(
                        msg.channel,
                        Lang.getEmbed('displayEmbeds.OCRNoTextDetected', data.lang())
                    );
                    return;
                }
                await MessageUtils.send(msg.channel, `\`\`\`${detectedText}\`\`\``);
            } catch (errMsg) {
                console.log(errMsg);
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
        }
    }
}
