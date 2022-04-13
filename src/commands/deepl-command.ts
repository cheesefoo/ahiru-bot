import translate from 'deepl';
import {
    Collection,
    Message,
    MessageApplicationCommandData,
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

export class DeepLCommand implements Command {
    public metadata: MessageApplicationCommandData = {
        name: Lang.getCom('commands.deepl'),
        // description: Lang.getRef('commandDescs.deepl', Lang.Default),
        type: 3,
        // type?: 'CHAT_INPUT' | ApplicationCommandTypes.CHAT_INPUT;
        // options?: ApplicationCommandOptionData[];
    };
    public requireDev = false;
    public requireGuild = false;
    public requirePerms = [];
    public deeplEmoji = '<:deepl:866753521393991683>';
    cooldown?: RateLimiter;
    deferType: CommandDeferType;
    requireClientPerms: PermissionString[] = [];
    requireUserPerms: PermissionString[] = [];

    public async execute(intr: MessageContextMenuInteraction, data: EventData): Promise<void> {
        // throw new Error('Method not implemented.');

        await intr.deferReply();
        let attachments = intr.targetMessage.attachments;
        let len: number = attachments instanceof Collection ? attachments.size : attachments.length;
        if (len !== 1) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed('displayEmbeds.OCRNoImage', data.lang()),
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
            if (text == undefined) {
                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('displayEmbeds.OCRNoTextDetected', data.lang()),
                    true
                );
                return;
            }
            let tl = await this.GetTranslation(text);
            if (tl != undefined) {
                await InteractionUtils.send(intr, tl, false);
                return;
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

    public keyword(langCode: LangCode): string {
        return Lang.getRef('commands.deepl', langCode);
    }

    public regex(langCode: LangCode): RegExp {
        return Lang.getRegex('commandRegexes.deepl', langCode);
    }

    public async executeMessage(msg: Message, args: string[], data: EventData): Promise<void> {
        let url = await MessageUtils.getUrl(msg, args);

        let text;
        if (url == undefined && args.length === 2) {
            await MessageUtils.send(
                msg.channel,
                Lang.getEmbed('displayEmbeds.deepLHelp', data.lang())
            );
            return;
        }
        if (url !== undefined) {
            try {
                text = await ApiUtils.OCRRequest(url);
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
        } else {
            text = args.slice(2).reduce((prev, cur, _index, _array) => {
                return prev + ' ' + cur;
            });
        }

        const emoji = msg.client.emojis.cache.find(e => e.name === 'deepl');
        let tl = await this.GetTranslation(text);
        if (tl != undefined) {
            tl = `${emoji}:${tl}`;
        }
        await MessageUtils.send(msg.channel, tl);
    }

    private async GetTranslation(text: string): Promise<string> {
        let resp = await translate({
            text: text,
            target_lang: 'EN',
            auth_key: process.env.deepl_key,
            free_api: true,
        });
        return await ApiUtils.ParseTranslations(resp.data.translations[0]);
    }
}
