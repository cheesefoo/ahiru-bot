import {
    ApplicationCommandData,
    BaseCommandInteraction,
    Message,
    MessageAttachment,
    PermissionString,
} from 'discord.js';
import { createRequire } from 'node:module';
import { LangCode } from '../models/enums';
import { EventData } from '../models/internal-models';
import { Lang, Logger } from '../services';
import { MessageUtils } from '../utils';
import { Command, CommandDeferType } from './command';
import Canvas from 'canvas';
import { Url } from 'url';

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
    metadata: ApplicationCommandData= {
        name: Lang.getCom('commands.subtitle'),
        description: Lang.getRef('commandDescs.subtitle', Lang.Default),
    };
    requireClientPerms: PermissionString[] = [];
    requireUserPerms: PermissionString[] = [];

    execute(intr: BaseCommandInteraction, data: EventData): Promise<void>
    {
        return Promise.resolve(undefined);
    }
    public async executeMessage(msg: Message, args: string[], data: EventData): Promise<void> {
        let template, text: string;
        let x, y, fontSize, lineWidth: number;
        if (args.length === 2) {
            await MessageUtils.send(msg.channel, Lang.getEmbed('displayEmbeds.subtitleHelp', data.lang()));
            return;
        }
        console.log(args[1].toString())
        switch (args[1]) {
            case "fist":
            case "arthur":
                {
                    template = 'https://cdn.discordapp.com/attachments/870361524789723187/902359723809075231/template2.png';
                    x = 499;
                    y = 433;
                    fontSize = 24;
                    lineWidth = 3;
                    break;
                }
            case "think":
            default:
                {
                    template = 'https://cdn.discordapp.com/attachments/825378176993722378/901942196293492836/template.png';
                    x = 1920;
                    y = 1080;
                    fontSize = 100
                    lineWidth = 8;
                    break;
                }

        }

        text = args.slice(2).reduce((prev, cur, _index, _array) => {
            return prev + ' ' + cur;
        });
        if (text.length > 50) {
            await MessageUtils.send(msg.channel, "sentence too long lol");
            return;
        }
        const canvas = Canvas.createCanvas(x, y);
        const ctx = canvas.getContext('2d');

        const background = await Canvas.loadImage(template);
        // This uses the canvas dimensions to stretch the image onto the entire canvas
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        // Pass the entire Canvas object because you'll need access to its width and context

        const applyText = (canvas, text) => {
            const context = canvas.getContext('2d');

            // Declare a base size of the font


            do {

                context.font = `${fontSize -= 10}px sans-serif`;

            } while (context.measureText(text).width > canvas.width - 100);

            // Return the result to use in the actual canvas
            return context.font;
        };
        // Assign the decided font to the canvas
        // ctx.font = applyText(canvas, text);
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.strokeStyle = 'black';
        ctx.lineWidth = lineWidth;
        ctx.fillStyle = '#1fe5ea';
        this.wrapText(ctx, text, canvas.width / 2, canvas.height * 0.9, canvas.width * 0.85, fontSize)

        // Use the helpful Attachment class structure to process the file for you
        const attachment = new MessageAttachment(canvas.toBuffer(), 'yourgarbagememe.png');

        await MessageUtils.send(msg.channel, { files: [attachment] });
    }
    private wrapText(context, text, x, y, maxWidth, lineHeight) {
        console.log(text)
        var words = text.split(' '),
            line = '',
            lineCount = 0,
            i,
            test,
            metrics;

        for (i = 0; i < words.length; i++) {
            test = words[i];
            metrics = context.measureText(test);
            while (metrics.width > maxWidth) {
                // Determine how much of the word will fit
                test = test.substring(0, test.length - 1);
                metrics = context.measureText(test);
            }
            if (words[i] != test) {
                words.splice(i + 1, 0, words[i].substr(test.length))
                words[i] = test;
            }

            test = line + words[i] + ' ';
            metrics = context.measureText(test);

            if (metrics.width > maxWidth && i > 0) {
                console.log(line);
                context.strokeText(line, x, y);
                context.fillText(line, x, y);
                line = words[i] + ' ';
                y += lineHeight;
                lineCount++;
            }
            else {
                line = test;
            }
        }
        context.strokeText(line, x, y);
        context.fillText(line, x, y);
    }

}
