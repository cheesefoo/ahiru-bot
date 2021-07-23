import { Guild, Emoji, Message, StringResolvable} from 'discord.js-light';
import { LangCode } from '../models/enums';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { MessageUtils } from '../utils';
import { Command } from './command';
import FormData from 'form-data';
import { parse, valid } from 'node-html-parser';
import translate, { DeeplLanguages } from 'deepl';
import { text } from 'express';
import { error } from 'console';
let Config = require('../../config/config.json');

export class DeepLCommand implements Command {
    public requireGuild = false;
    public requirePerms = [];
    public deeplEmoji = '<:deepl:866753521393991683>';

    public keyword(langCode: LangCode): string {
        return Lang.getRef('commands.deepl', langCode);
    }

    public regex(langCode: LangCode): RegExp {
        return Lang.getRegex('commands.deepl', langCode);
    }

    public async execute(msg: Message, args: string[], data: EventData): Promise<void> {
        if (args.length == 2) {
            await MessageUtils.send(msg.channel, Lang.getEmbed('displays.deepLHelp', data.lang()));
            return;
        }
        const emoji = msg.client.emojis.cache.find(e => e.name === 'deepl');
        let text = args.slice(2).reduce((prev, cur, _index, _array) => {
            return prev + cur;
        });
        let resp = await translate({
            text: text,
            target_lang: 'EN',
            auth_key: process.env.deepl,
            free_api: true
        });
        let tl = await this.ParseTranslations(resp.data.translations[0]);

        if (tl != undefined) {
            tl = `${emoji}:${tl}`;
        }
        await MessageUtils.send(msg.channel, tl);
    }

    private async ParseTranslations(translations: {
        detected_source_language: string;
        text: string;
    }): Promise<string> {
        let srcLang = translations.detected_source_language;
        let text = translations.text;
        let tl = text;
        if (this.IsEnglish(srcLang)) {
            tl = await translate({
                text: text,
                source_lang: "EN",
                target_lang: "JA",
                auth_key:process.env.deepl,
                free_api: true
            }).then(resp => resp.data.translations[0].text)
                .catch(error => error.toString())
        }
        return tl;
    }

    private IsEnglish(lang: string): boolean {
        return lang == 'EN' || lang == 'EN-US' || lang == 'EN-GB';
    }
}
