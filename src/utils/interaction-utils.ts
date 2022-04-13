import { RESTJSONErrorCodes as DiscordApiErrors } from 'discord-api-types/v9';
import {
    BaseCommandInteraction,
    CommandInteraction,
    DiscordAPIError,
    Message,
    MessageComponentInteraction,
    MessageContextMenuInteraction,
    MessageEmbed,
    MessageInteraction,
    MessageOptions,
} from 'discord.js';

import { MessageUtils } from './index.js';

const IGNORED_ERRORS = [
    DiscordApiErrors.UnknownMessage,
    DiscordApiErrors.UnknownChannel,
    DiscordApiErrors.UnknownGuild,
    DiscordApiErrors.UnknownUser,
    DiscordApiErrors.UnknownInteraction,
    DiscordApiErrors.CannotSendMessagesToThisUser, // User blocked bot or DM disabled
    DiscordApiErrors.ReactionWasBlocked, // User blocked bot or DM disabled
];

export class InteractionUtils {
    public static async deferReply(
        intr: BaseCommandInteraction | MessageComponentInteraction,
        // intr: CommandInteraction | MessageComponentInteraction,
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

    public static async deferUpdate(intr: MessageComponentInteraction): Promise<void> {
        try {
            return await intr.deferUpdate();
        } catch (error) {
            if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async send(
        intr: BaseCommandInteraction,
        // intr: CommandInteraction | MessageComponentInteraction | MessageContextMenuInteraction,
        content: string | MessageEmbed | MessageOptions,
        hidden: boolean = false
    ): Promise<Message> {
        try {
            let msgOptions = MessageUtils.messageOptions(content);
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

    public static async editReply(
        intr: CommandInteraction | MessageComponentInteraction,
        content: string | MessageEmbed | MessageOptions
    ): Promise<Message> {
        try {
            let msgOptions = MessageUtils.messageOptions(content);
            return (await intr.editReply({
                ...msgOptions,
            })) as Message;
        } catch (error) {
            if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async update(
        intr: MessageComponentInteraction,
        content: string | MessageEmbed | MessageOptions
    ): Promise<void> {
        try {
            let msgOptions = MessageUtils.messageOptions(content);
            return await intr.update({
                ...msgOptions,
            });
        } catch (error) {
            if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(error.code)) {
                return;
            } else {
                throw error;
            }
        }
    }
}
