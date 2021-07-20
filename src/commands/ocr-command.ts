import { Message } from 'discord.js-light';
import fetch from 'node-fetch';

import { LangCode } from '../models/enums';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { MessageUtils } from '../utils';
import { Command } from './command';
import FormData from 'form-data';
import { parse, valid } from 'node-html-parser';
import vision from '@google-cloud/vision';

let Config = require("../../config/config.json")

export class OCRCommand implements Command {
    public requireGuild = false;
    public requirePerms = [];
        // Creates a client
        public client = new vision.ImageAnnotatorClient();

    public keyword(langCode: LangCode): string {
        return Lang.getRef('commands.ocr', langCode);
    }

    public regex(langCode: LangCode): RegExp {
        return Lang.getRegex('commands.ocr', langCode);
    }

    public async execute(msg: Message, args: string[], data: EventData): Promise<void> {
        let url;
        msg.embeds.forEach((embed)=> {
            url = embed?.image?.url;
        })

        await MessageUtils.send(msg.channel, "NYI");
    }
    
}
