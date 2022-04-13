import Canvas from 'canvas';
import { MessageAttachment } from 'discord.js';

export class CanvasUtils {
    public static async OverlayText(
        template: string,
        text: string,
        x: number = 1920,
        y: number = 1080,
        fontSize: number = 100,
        lineWidth: number = 8
    ): Promise<MessageAttachment> {
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
                context.font = `${(fontSize -= 10)}px sans-serif`;
            } while (context.measureText(text).width > canvas.width - 100);

            // Return the result to use in the actual canvas
            return context.font;
        };
        // Assign the decided font to the canvas
        // ctx.font = applyText(canvas, text);
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = lineWidth;
        ctx.fillStyle = '#1fe5ea';
        this.wrapText(
            ctx,
            text,
            canvas.width / 2,
            canvas.height * 0.9,
            canvas.width * 0.85,
            fontSize
        );

        // Use the helpful Attachment class structure to process the file for you
        const attachment = new MessageAttachment(canvas.toBuffer(), 'yourgarbagememe.png');
        return attachment;
    }

    private static wrapText(context, text, x, y, maxWidth, lineHeight) {
        console.log(text);
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
                words.splice(i + 1, 0, words[i].substr(test.length));
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
            } else {
                line = test;
            }
        }
        context.strokeText(line, x, y);
        context.fillText(line, x, y);
    }
}
