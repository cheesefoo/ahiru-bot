import {
    ApplicationCommandData,
    BaseCommandInteraction,
    Message,
    PermissionString,
} from 'discord.js';

import JishoAPI from 'unofficial-jisho-api';
import { LangCode } from '../models/enums';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';
import { MessageUtils } from '../utils';
import { Command, CommandDeferType } from './command';
import { MessageEmbed } from 'discord.js';

export class JishoCommand implements Command {
    public requireDev = false;
    public requireGuild = false;
    public requirePerms = [];
    public jisho = new JishoAPI();

    public keyword(langCode: LangCode): string {
        return Lang.getRef('commands.jisho', langCode);
    }

    public regex(langCode: LangCode): RegExp {
        return Lang.getRegex('commandRegexes.jisho', langCode);
    }

    public async executeMessage(msg: Message, args: string[], data: EventData): Promise<void> {
        if (args.length == 2) {
            await MessageUtils.send(
                msg.channel,
                Lang.getEmbed('displayEmbeds.jishoHelp', data.lang())
            );
            return;
        }
        let text = args.slice(2).reduce((prev, cur, _index, _array) => {
            return prev + cur;
        });
        if (text.length == 1) {
            await this.jisho
                .searchForKanji(text)
                .then(async result => {
                    if (result.found == false) {
                        await MessageUtils.send(
                            msg.channel,
                            Lang.getEmbed('displayEmbeds.jishoKanjiError', data.lang(), {
                                ERROR: `${text} not found.`,
                            })
                        );
                        return;
                    }
                    let embed = {
                        color: 0x56d926,
                        title: text,
                        url: result.uri,
                        // author: {
                        //     name: 'Some name',
                        //     icon_url: 'https://i.imgur.com/wSTFkRM.png',
                        //     url: 'https://discord.js.org',
                        // },
                        description: result.meaning,
                        thumbnail: {
                            url: result.strokeOrderGifUri,
                        },
                        fields: [
                            {
                                name: `Kunyomi: ${result.kunyomi.reduce(
                                    (prev, cur, _index, _array) => prev + cur + ' '
                                )}`,
                                value: `Onyomi: ${result.onyomi.reduce(
                                    (prev, cur, _index, _array) => prev + cur + ' '
                                )}`,
                            },
                            {
                                name: `Radical: ${result.radical.symbol} - ${result.radical.meaning}`,
                                value: `Parts: ${result.parts.reduce(
                                    (prev, cur, _index, _array) => prev + cur
                                )}`,
                            },
                        ],
                        image: {
                            url: result.strokeOrderDiagramUri,
                        },

                        footer: {
                            text: `JLPT ${result.jlptLevel} | ${result.strokeCount} strokes`,
                        },
                    };

                    msg.channel.send({ embeds: [embed] });
                    // console.log('Found: ' + result.found);
                    // console.log('Taught in: ' + result.taughtIn);
                    // console.log('JLPT level: ' + result.jlptLevel);
                    // console.log('Newspaper frequency rank: ' + result.newspaperFrequencyRank);
                    // console.log('Stroke count: ' + result.strokeCount);
                    // console.log('Meaning: ' + result.meaning);
                    // console.log('Kunyomi: ' + JSON.stringify(result.kunyomi));
                    // console.log('Kunyomi example: ' + JSON.stringify(result.kunyomiExamples[0]));
                    // console.log('Onyomi: ' + JSON.stringify(result.onyomi));
                    // console.log('Onyomi example: ' + JSON.stringify(result.onyomiExamples[0]));
                    // console.log('Radical: ' + JSON.stringify(result.radical));
                    // console.log('Parts: ' + JSON.stringify(result.parts));
                    // console.log('Stroke order diagram: ' + result.strokeOrderDiagramUri);
                    // console.log('Stroke order SVG: ' + result.strokeOrderSvgUri);
                    // console.log('Stroke order GIF: ' + result.strokeOrderGifUri);
                    // console.log('Jisho Uri: ' + result.uri);
                })
                .catch(async err => {
                    await MessageUtils.send(
                        msg.channel,
                        Lang.getEmbed('displayEmbeds.kanjiError', data.lang(), {
                            ERROR: err.toString(),
                        })
                    );
                    return;
                });
            return;
        }
        // else {
        //     try {
        //         let response = await this.jisho.searchForPhrase(text);
        //         if (response.data.length == 0) {
        //             await MessageUtils.send(
        //                 msg.channel,
        //                 Lang.getEmbed('displayEmbeds.jishoNoResults', data.lang(), { SEARCH_TERM: text })
        //             );
        //         }
        //         console.log(response);
        //         response.data.forEach(entry => {
        //             console.log(entry.japanese);
        //             console.log(entry.senses);
        //             console.log(entry.attribution);
        //         });
        //     } catch (error) {}
        // }

        await MessageUtils.send(msg.channel, Lang.getEmbed('displayEmbeds.jishoHelp', data.lang()));
    }

    deferType: CommandDeferType;
    metadata: ApplicationCommandData = {
        name: Lang.getCom('commands.jisho'),
        description: Lang.getRef('commandDescs.jisho', Lang.Default),
    };
    requireClientPerms: PermissionString[] = [];
    requireUserPerms: PermissionString[] = [];

    execute(intr: BaseCommandInteraction, data: EventData): Promise<void> {
        return Promise.resolve(undefined);
    }
}
