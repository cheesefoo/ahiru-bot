import {
    ApplicationCommandData,
    BaseCommandInteraction,
    Message,
    PermissionString,
} from 'discord.js';
import fetch from 'node-fetch';

import FormData from 'form-data';
import { createRequire } from 'node:module';
import { LangCode } from '../models/enums';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { MathUtils, MessageUtils, UrlUtils } from '../utils';
import { Command, CommandDeferType } from './command';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');

export class PuzzleCommand implements Command {
    public requireDev = false;
    public requireGuild = false;
    public requirePerms = [];

    public keyword(langCode: LangCode): string {
        return Lang.getRef('commands.puzzle', langCode);
    }

    public regex(langCode: LangCode): RegExp {
        return Lang.getRegex('commandRegexes.puzzle', langCode);
    }
    deferType: CommandDeferType;
    metadata: ApplicationCommandData;
    requireClientPerms: PermissionString[] = [];
    requireUserPerms: PermissionString[] = [];

    execute(intr: BaseCommandInteraction, data: EventData): Promise<void> {
        return Promise.resolve(undefined);
    }
    public async executeMessage(msg: Message, args: string[], data: EventData): Promise<void> {
        /*    if (args.length == 2) {
            await MessageUtils.send(
                msg.channel,
                Lang.getEmbed('displayEmbeds.puzzleHelp', data.lang())
            );
            return;
        }
        let imgUrl: any, numOfPieces: any, isRotation: any;
        try {
            imgUrl = args[2];
            numOfPieces = Number.parseInt(args[3]) ?? 400;
            numOfPieces = MathUtils.clamp(
                numOfPieces,
                Config.puzzle.minimumNumberOfPieces,
                Config.puzzle.maximumNumberOfPieces
            );
            isRotation = args[4] ?? false;
        } catch (error) {
            await MessageUtils.send(
                msg.channel,
                Lang.getEmbed('displayEmbeds.puzzleHelp', data.lang())
            );
            return;
        }
        if (!UrlUtils.isValidImageArg(imgUrl)) {
            await MessageUtils.send(
                msg.channel,
                Lang.getEmbed('displayEmbeds.puzzleBadUrl', data.lang())
            );
        } else {
            let reply = await this.getPuzzle(imgUrl, numOfPieces, isRotation);
            await MessageUtils.send(msg.channel, reply);
        }*/
    }

    /*    private async getPuzzle(
        imgUrl: string,
        numberOfPieces: Number,
        shouldRotate: boolean
    ): Promise<string> {
        const form = new FormData();
        form.append('image-url', imgUrl);
        form.append('puzzle-nop', numberOfPieces);
        const options = {
            method: 'POST',
            body: form,
        };

        // image-url: https://i.pximg.net/img-original/img/2021/07/17/00/18/58/91290164_p0.png
        // puzzle-nop:  https://www.jigsawexplorer.com/jigsaw-puzzle-result/
        // let resp = await fetch('https://www.jigsawexplorer.com/create-a-custom-jigsaw-puzzle/', options)
        let resp = await fetch(
            'https://www.jigsawexplorer.com/jigsaw-puzzle-result/',
            options
        ).then(res => res.text());

        const html = parse(resp, {
            blockTextElements: {
                script: false, // keep text content when parsing
                style: false, // keep text content when parsing
                pre: false, // keep text content when parsing
            },
        });
        // console.log(html.toString());
        let linkElement = html.querySelector('#short-link');
        // console.log(linkElement.toString());
        let link = linkElement.getAttribute('value');
        // console.log(link)

        let reply = `Here is your ${numberOfPieces} piece puzzle. Remember to set it to multiplayer.\n${link}`;

        return reply;
    }*/
}
