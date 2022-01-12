import {
    Collection, CommandInteraction,
    DiscordAPIError,
    EmojiResolvable,
    Message,
    MessageAttachment,
    MessageEmbed,
    MessageOptions,
    MessageReaction,
    Snowflake,
    TextBasedChannels,
    User,
} from 'discord.js';
import { UrlUtils } from '.';import { RESTJSONErrorCodes as DiscordApiErrors } from 'discord-api-types/rest/v9';
import { EmbedUtils } from './embed-utils';
const IGNORED_ERRORS = [
    DiscordApiErrors.UnknownMessage,
    DiscordApiErrors.UnknownChannel,
    DiscordApiErrors.UnknownGuild,
    DiscordApiErrors.UnknownUser,
    DiscordApiErrors.UnknownInteraction,
    DiscordApiErrors.CannotSendMessagesToThisUser, // User blocked bot or DM disabled
    DiscordApiErrors.ReactionWasBlocked, // User blocked bot or DM disabled
];

export class MessageUtils {
    public static async send(
        target: User | TextBasedChannels,
        content: string | MessageEmbed | MessageOptions
    ): Promise<Message> {
        try {
            let msgOptions = this.messageOptions(content);
            return await target.send(msgOptions);
        } catch (error) {
            // 10003: "Unknown channel"
            // 10004: "Unknown guild"
            // 10013: "Unknown user"
            // 50007: "Cannot send messages to this user" (User blocked bot or DM disabled)
            if (
                error instanceof DiscordAPIError &&
                [10003, 10004, 10013, 50007].includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }
    public static content(msg: Message): string {
        return [
            msg.content,
            ...msg.embeds.filter(embed => !embed.provider).map(embed => EmbedUtils.content(embed)),
        ]
            .filter(Boolean)
            .join('\n');
    }   public static async deferIntr(
        intr: CommandInteraction,
        hidden: boolean = false
    ): Promise<void> {
        try {
            return await intr.deferReply({
                ephemeral: hidden,
            });
        } catch (error) {
            if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async sendIntr(
        intr: CommandInteraction,
        content: string | MessageEmbed | MessageOptions,
        hidden: boolean = false
    ): Promise<Message> {
        try {
            let msgOptions = this.messageOptions(content);
            return (await intr.followUp({
                ...msgOptions,
                ephemeral: hidden,
            })) as Message;
        } catch (error) {
            if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async reply(
        msg: Message,
        content: string | MessageEmbed | MessageOptions
    ): Promise<Message> {
        try {
            let msgOptions = this.messageOptions(content);
            return await msg.reply(msgOptions);
        } catch (error) {
            // 10008: "Unknown Message" (Message was deleted)
            // 50007: "Cannot send messages to this user" (User blocked bot or DM disabled)
            if (error instanceof DiscordAPIError && [10008, 50007].includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async edit(
        msg: Message,
        content: string | MessageEmbed | MessageOptions
    ): Promise<Message> {
        try {
            let msgOptions = this.messageOptions(content);
            return await msg.edit(msgOptions);
        } catch (error) {
            // 10008: "Unknown Message" (Message was deleted)
            // 50007: "Cannot send messages to this user" (User blocked bot or DM disabled)
            if (error instanceof DiscordAPIError && [10008, 50007].includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }
    public static async getEmbedUrl(msg: Message): Promise<string> {
        let embedUrl;
        msg.attachments.forEach(a => {
            let u = a.url;
            if (u !== undefined) {
                embedUrl = u;
                return;
            }
        });
        return embedUrl;
    }
    public static async getUrl(msg: Message, args: string[]): Promise<string> | undefined {
        let url = await MessageUtils.getEmbedUrl(msg);
        if (url === undefined && UrlUtils.isValidHttpUrl(args[2])) {
            url = args[2];
        }
        return url;
    }

    public static async react(msg: Message, emoji: EmojiResolvable): Promise<MessageReaction> {
        try {
            return await msg.react(emoji);
        } catch (error) {
            // 10008: "Unknown Message" (Message was deleted)
            // 90001: "Reaction Blocked" (User blocked bot)
            if (error instanceof DiscordAPIError && [10008, 90001].includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async delete(msg: Message): Promise<Message> {
        try {
            return await msg.delete();
        } catch (error) {
            // 10008: "Unknown Message" (Message was deleted)
            // 50007: "Cannot send messages to this user" (User blocked bot or DM disabled)
            if (error instanceof DiscordAPIError && [10008, 50007].includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }

    private static messageOptions(content: string | MessageEmbed | MessageOptions): MessageOptions {
        let options: MessageOptions = {};
        if (typeof content === 'string') {
            options.content = content;
        } else if (content instanceof MessageEmbed) {
            options.embeds = [content];
        } else {
            options = content;
        }
        return options;
    }
}
