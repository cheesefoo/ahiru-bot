import { Message } from 'discord.js-light';
import fetch from 'node-fetch';

import { LangCode } from '../models/enums';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { MessageUtils } from '../utils';
import { Command } from './command';
import FormData from 'form-data';
import  { parse,valid } from 'node-html-parser';

let Config = require("../../config/config.json")

export class PuzzleCommand implements Command {
    public requireGuild = false;
    public requirePerms = [];

    public keyword(langCode: LangCode): string {
        return Lang.getRef('commands.puzzle', langCode);
    }

    public regex(langCode: LangCode): RegExp {
        return Lang.getRegex('commands.puzzle', langCode);
    }

    public async execute(msg: Message, args: string[], data: EventData): Promise<void> {
        let imgUrl: any, numOfPieces: any, isRotation: any;
        try {
            imgUrl = args[2];
            numOfPieces = Number.parseInt(args[3]);
            numOfPieces = Math.max(Config.puzzle.minimumNumberOfPieces,
                Math.min(numOfPieces, Config.puzzle.maximumNumberOfPieces));
            isRotation = args[4];
        } catch (error) { }
        if (!this.isValidImageArg(imgUrl)) {
            await MessageUtils.send(msg.channel, Lang.getEmbed('displays.puzzleBadUrl', data.lang()));
        } else {
            let reply = await this.getPuzzle(imgUrl, numOfPieces, isRotation);
            await MessageUtils.send(msg.channel, reply);
        }
    }

    private async getPuzzle(imgUrl: string, numberOfPieces: Number, shouldRotate: boolean): Promise<string> {

        const form = new FormData();
        form.append('image-url', imgUrl);
        form.append('puzzle-nop', numberOfPieces);
        const options = {
            method: 'POST',
            body: form
        };

        // image-url: https://i.pximg.net/img-original/img/2021/07/17/00/18/58/91290164_p0.png
        // puzzle-nop:  https://www.jigsawexplorer.com/jigsaw-puzzle-result/
        // let resp = await fetch('https://www.jigsawexplorer.com/create-a-custom-jigsaw-puzzle/', options)
        let resp = await fetch('https://www.jigsawexplorer.com/jigsaw-puzzle-result/', options)
            .then(res => res.text());
        // const re = /(<style.*<\/style>)|(<script.*<\/script>)/mgis
        // resp = resp.replace(re, "");
        // console.log(resp);
        // let fix = resp;
        // let fug = fix.split("</body")
        // let xml = `${fug[0]}${fug[1]}`
        // let xml = resp.replace(/&/g,"");
        const html = parse(resp, {
            blockTextElements: {
                script: false,	// keep text content when parsing
                style: false,		// keep text content when parsing
                pre: false			// keep text content when parsing
            }
        });
        // console.log(html.toString());
        let linkElement = html.querySelector("#short-link")
        // console.log(linkElement.toString());
        let link = linkElement.getAttribute("value")
        // console.log(link)

        let reply = `Here is your ${numberOfPieces} piece puzzle. Remember to set it to multiplayer.\n${link}`



        return reply;
    }


    private isValidImageArg(imgUrl: string): boolean {
        imgUrl = imgUrl.toLowerCase();
        let validExtensions = Config.puzzle.validExtensions;
        let valid = false;
        validExtensions.forEach((xt: string) => {
            valid = valid || imgUrl.endsWith(xt);
        });
        return valid;

    }
}
