import { Message, MessageAttachment } from 'discord.js-light';
import fetch from 'node-fetch';

import { LangCode } from '../models/enums';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { MessageUtils, UrlUtils } from '../utils';
import { Command } from './command';
import FormData from 'form-data';
import { parse, valid } from 'node-html-parser';
import { ImageAnnotatorClient } from '@google-cloud/vision';



let Config = require("../../config/config.json")

export class OCRCommand implements Command {
    public requireGuild = false;
    public requirePerms = [];
    private client = new ImageAnnotatorClient();

    public keyword(langCode: LangCode): string {
        return Lang.getRef('commands.ocr', langCode);
    }

    public regex(langCode: LangCode): RegExp {
        return Lang.getRegex('commands.ocr', langCode);
    }

    public async execute(msg: Message, args: string[], data: EventData): Promise<void> {

        let embedUrl: string, url: string, detectedText: string;
        msg.attachments.forEach((attachment: MessageAttachment) => {
            let u = attachment.url;
            if (u != undefined) {
                embedUrl = u;
                return;
            }
        })
        url = embedUrl ?? args[2];
        console.log(url);

        if (url == undefined) {
            await MessageUtils.send(msg.channel, Lang.getEmbed('displays.ocrBadImage', data.lang()));
        } else {
            try {

                const request =
                {
                    "image": {
                        "source": {
                            "imageUri": `${url}`
                        }
                    },
                    // "features": [{ "type": "TEXT_DETECTION" }],
                    "imageContext": {
                        "languageHints": ["JA"],
                        "textDetectionParams": {
                            "enableTextDetectionConfidenceScore": "true"
                        }
                    }
                };
                const requests = {
                    "requests": [request]
                };

                const [result] = await this.client.textDetection(request);
                const errMsg = result.error.message;
                if (errMsg != undefined) {
                    if (result.error.message == 'We can not access the URL currently. Please download the content and pass it in.') {
                        await MessageUtils.send(msg.channel, Lang.getEmbed('displays.OCRCanNotAccessUrl', data.lang()));
                        return;
                    }
                    await MessageUtils.send(msg.channel, Lang.getEmbed('displays.OCRGenericError', data.lang(), {
                        ERROR: errMsg,
                    }));
                    return;
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

