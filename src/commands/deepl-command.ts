import translate from 'deepl';
import { Message } from 'discord.js';
import { LangCode } from '../models/enums';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { ApiUtils, MessageUtils } from '../utils';
import { Command } from './command';

let Config = require('../../config/config.json');

export class DeepLCommand implements Command {
    public requireDev = false;
    public requireGuild = false;
    public requirePerms = [];
    public deeplEmoji = '<:deepl:866753521393991683>';

    public keyword(langCode: LangCode): string {
        return Lang.getRef('commands.deepl', langCode);
    }

    public regex(langCode: LangCode): RegExp {
        return Lang.getRegex('commandRegexes.deepl', langCode);
    }

    public async execute(msg: Message, args: string[], data: EventData): Promise<void> {
        let url = await MessageUtils.getUrl(msg, args);
        let detectedText;
        let text;
        if (url == undefined && args.length === 2) {
            await MessageUtils.send(
                msg.channel,
                Lang.getEmbed('displayEmbeds.deepLHelp', data.lang())
            );
            return;
        }
        if (url != undefined) {
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
                text = detectedText;
            } catch (err) {
                console.log(err);
                await MessageUtils.send(msg.channel, err);
            }
        } else {
            if (args.length === 2) {
                await MessageUtils.send(
                    msg.channel,
                    Lang.getEmbed('displayEmbeds.deepLHelp', data.lang())
                );
                return;
            }
            text = args.slice(2).reduce((prev, cur, _index, _array) => {
                return prev + ' ' + cur;
            });
        }

        const emoji = msg.client.emojis.cache.find(e => e.name === 'deepl');

        let resp = await translate({
            text: text,
            target_lang: 'EN',
            auth_key: process.env.deepl_key,
            free_api: true,
        });
        let tl = await ApiUtils.ParseTranslations(resp.data.translations[0]);

        if (tl != undefined) {
            tl = `${emoji}:${tl}`;
        }
        await MessageUtils.send(msg.channel, tl);
    }
}
