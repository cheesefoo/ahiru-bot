import translate from 'deepl';
import { Message, MessageAttachment } from 'discord.js';
import { LangCode } from '../models/enums';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { ApiUtils, MessageUtils } from '../utils';
import { Command } from './command';
import Canvas from 'canvas';


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

    public async execute(msg: Message, args: string[], data: EventData): Promise<void> {
        let template = 'https://cdn.discordapp.com/attachments/825378176993722378/901942196293492836/template.png';
        let text;
        if (args.length === 2) {
            await MessageUtils.send(msg.channel, Lang.getEmbed('displayEmbeds.deepLHelp', data.lang()));
            return;
        }

        text = args.slice(2).reduce((prev, cur, _index, _array) => {
            return prev + cur;
        });
        const canvas = Canvas.createCanvas(700, 250);
        const ctx = canvas.getContext('2d');

        const background = await Canvas.loadImage(template);
        // This uses the canvas dimensions to stretch the image onto the entire canvas
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        // Pass the entire Canvas object because you'll need access to its width and context
        const applyText = (canvas, text) => {
            const context = canvas.getContext('2d');

            // Declare a base size of the font
            let fontSize = 70;

            do {
                // Assign the font to the context and decrement it so it can be measured again
                context.font = `${fontSize -= 10}px sans-serif`;
                // Compare pixel width of the text to the canvas minus the approximate avatar size
            } while (context.measureText(text).width > canvas.width - 300);

            // Return the result to use in the actual canvas
            return context.font;
        };
        // Assign the decided font to the canvas
        ctx.font = applyText(canvas, text);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = "center";
        this.wrapText(ctx, text, canvas.width / 2.5, canvas.height / 1.8, canvas.width - 1000, 18)



        // Use the helpful Attachment class structure to process the file for you
        const attachment = new MessageAttachment(canvas.toBuffer(), 'profile-image.png');





        await MessageUtils.send(msg.channel, { files: [attachment] });
    }
    private wrapText(context, text, x, y, maxWidth, lineHeight) {

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
                context.fillText(line, x, y);
                line = words[i] + ' ';
                y += lineHeight;
                lineCount++;
            }
            else {
                line = test;
            }
        }

        context.fillText(line, x, y);
    }

}
