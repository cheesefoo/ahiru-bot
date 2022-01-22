import { Message, MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js';

import { Reaction } from '.';
import { EventData } from '../models/internal-models';
import { FormatUtils, MessageUtils } from '../utils';

let Config = require('../../config/config.json');

export class UnPinReaction implements Reaction {
    public emoji: string = Config.reactions.pin;
    public requireGuild = true;

    constructor() {}

    requireSentByClient: boolean;
    requireEmbedAuthorTag: boolean;

    public async execute(
        msgReaction: MessageReaction,
        msg: Message,
        reactor: User,
        data: EventData
    ): Promise<void> {
        //pleiades = 831379672431329330
        //venndiagram = 870361524789723187
        const starboardChannel = '831379672431329330';
        if (msgReaction.emoji.name != 'SubaPin') {
            return;
        }
        // let msg = msgReaction.message;
        // Don't respond to reaction on client's message
        if (msg.author.id === msg.client.user.id) {
            return;
        }
        //dont respond to anything on the starboard
        if (msg.channel.id == starboardChannel) {
            return;
        }

        const emoji = msg.client.emojis.cache.find(e => e.name === 'SubaPin');
        const starChannel = msg.guild.channels.cache.get(starboardChannel) as TextChannel;
        if (!starChannel) {
            MessageUtils.send(reactor, 'i cant find the starboard channel :(');
        }
        const fetchedMessages = await starChannel.messages.fetch({ limit: 10 });
        const starboardedMessage = fetchedMessages.find(m =>
            m.embeds[0]?.footer.text.endsWith(msg.id)
        );

        if (starboardedMessage) {
            if (starboardedMessage.author.id !== msg.client.user.id) {
                return;
            }
            const star = /^([0-9]{1,3})\s\|\s([0-9]{17,20})/.exec(
                starboardedMessage.embeds[0].footer.text
            );
            const foundStar = starboardedMessage.embeds[0];
            const image =
                msg.attachments.size > 0
                    ? await this.extension(emoji, msg.attachments.first().url)
                    : '';
            const embed = new MessageEmbed()
                .setColor(foundStar.color)
                .setTitle('Jump to message')
                .setURL(msg.url)
                .setDescription(foundStar.description)
                .setAuthor(msg.author.tag, msg.author.displayAvatarURL())
                .setTimestamp()
                .setFooter(
                    `${parseInt(star[1]) - 1} | ${msg.id}`,
                    `https://cdn.discordapp.com/attachments/766887144455012393/870375200938663936/emoji.png`
                )
                .setImage(image);
            const starMsg = await starChannel.messages.fetch(starboardedMessage.id);
            await starMsg.edit({ embeds: [embed] });
            if (parseInt(star[1]) - 1 <= 5) starMsg.delete();
        }
    }

    // Here we add the this.extension function to check if there's anything attached to the message.
    extension(reaction, attachment) {
        const imageLink = attachment.split('.');
        const typeOfImage = imageLink[imageLink.length - 1];
        const image = /(jpg|jpeg|png|gif)/gi.test(typeOfImage);
        if (!image) return '';
        return attachment;
    }
}
