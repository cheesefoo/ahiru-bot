import {
    BaseCommandInteraction,
    CommandInteraction,
    GuildMember,
    Message,
    NewsChannel,
    Permissions,
    TextChannel,
    ThreadChannel,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';
import { createRequire } from 'node:module';

import { Command, CommandDeferType } from '../commands';
import { LangCode } from '../models/enums';
import { EventData } from '../models/internal-models.js';
import { Lang, Logger } from '../services';
import { CommandUtils, InteractionUtils, MessageUtils, PermissionUtils } from '../utils';
import { EventHandler } from './index.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');
let Debug = require('../../config/debug.json');

let Logs = require('../../lang/logs.json');

export class CommandHandler implements EventHandler {
    private rateLimiter = new RateLimiter(
        Config.rateLimiting.commands.amount,
        Config.rateLimiting.commands.interval * 1000
    );

    constructor(
        private prefix: string,
        private helpCommand: Command,
        private commands: Command[]
    ) {}

    public shouldHandle(msg: Message, args: string[]): boolean {
        if (args[0].startsWith(this.prefix + this.prefix)) {
            return false;
        }
        if (args[0].length > 0 && args[0][0] == this.prefix) {
            args.splice(1, 0, args[0].slice(1));
            args[0] = this.prefix;
        }

        return (
            [this.prefix, `<@${msg.client.user.id}>`, `<@!${msg.client.user.id}>`].includes(
                args[0].toLowerCase()
            ) && !msg.author.bot
        );
    }

    public async process(intr: BaseCommandInteraction): Promise<void> {
        // Don't respond to self, or other bots
        if (intr.user.id === intr.client.user?.id || intr.user.bot) {
            return;
        }
        // Check if user is rate limited
        let limited = this.rateLimiter.take(intr.user.id);
        if (limited) {
            return;
        }

        // Try to find the command the user wants
        let command = this.commands.find(command => command.metadata.name === intr.commandName);
        if (!command) {
            Logger.error(
                Logs.error.commandNotFound
                    .replaceAll('{INTERACTION_ID}', intr.id)
                    .replaceAll('{COMMAND_NAME}', intr.commandName)
            );
            return;
        }

        // Defer interaction
        // NOTE: Anything after this point we should be responding to the interaction
        switch (command.deferType) {
            case CommandDeferType.PUBLIC: {
                await InteractionUtils.deferReply(intr, false);
                break;
            }
            case CommandDeferType.HIDDEN: {
                await InteractionUtils.deferReply(intr, true);
                break;
            }
        }

        // Return if defer was unsuccessful
        if (command.deferType !== CommandDeferType.NONE && !intr.deferred) {
            return;
        }

        // TODO: Get data from database
        let data = new EventData();

        try {
            // Check if interaction passes command checks
            let passesChecks = await CommandUtils.runChecks(command, intr, data);
            if (passesChecks) {
                // Execute the command
                await command.execute(intr, data);
            }
        } catch (error) {
            await this.sendError(intr, data);

            // Log command error
            Logger.error(
                intr.channel instanceof TextChannel ||
                    intr.channel instanceof NewsChannel ||
                    intr.channel instanceof ThreadChannel
                    ? Logs.error.commandGuild
                          .replaceAll('{INTERACTION_ID}', intr.id)
                          .replaceAll('{COMMAND_NAME}', command.metadata.name)
                          .replaceAll('{USER_TAG}', intr.user.tag)
                          .replaceAll('{USER_ID}', intr.user.id)
                          .replaceAll('{CHANNEL_NAME}', intr.channel.name)
                          .replaceAll('{CHANNEL_ID}', intr.channel.id)
                          .replaceAll('{GUILD_NAME}', intr.guild?.name)
                          .replaceAll('{GUILD_ID}', intr.guild?.id)
                    : Logs.error.commandOther
                          .replaceAll('{INTERACTION_ID}', intr.id)
                          .replaceAll('{COMMAND_NAME}', command.metadata.name)
                          .replaceAll('{USER_TAG}', intr.user.tag)
                          .replaceAll('{USER_ID}', intr.user.id),
                error
            );
        }
    }

    public async processMessage(msg: Message, args: string[]): Promise<void> {
        // Check if user is rate limited
        let limited = this.rateLimiter.take(msg.author.id);
        if (limited) {
            return;
        }

        // TODO: Get data from database
        let data = new EventData();

        // Check if I have permission to send a message
        if (!PermissionUtils.canSendEmbed(msg.channel)) {
            // No permission to send message
            if (PermissionUtils.canSend(msg.channel)) {
                let message = Lang.getRef('messages.missingEmbedPerms', data.lang());
                await MessageUtils.send(msg.channel, message);
            }
            return;
        }

        // If only a prefix, run the help command
        if (args.length === 1) {
            await this.helpCommand.executeMessage(msg, args, data);
            return;
        }

        // Try to find the command the user wants
        let command = this.find(args[1], data.lang());

        // If no command found, run the help command
        if (!command) {
            await this.helpCommand.executeMessage(msg, args, data);
            return;
        }

        if (command.requireDev && !Config.developers.includes(msg.author.id)) {
            await MessageUtils.send(
                msg.channel,
                Lang.getEmbed('validationEmbeds.devOnlyCommand', data.lang())
            );
            return;
        }

        if (command.requireGuild && !msg.guild) {
            await MessageUtils.send(
                msg.channel,
                Lang.getEmbed('validationEmbeds.serverOnlyCommand', data.lang())
            );
            return;
        }

        if (msg.member && !this.hasPermission(msg.member, command)) {
            await MessageUtils.send(
                msg.channel,
                Lang.getEmbed('validationEmbeds.permissionRequired', data.lang())
            );
            return;
        }

        // Execute the command
        try {
            await command.executeMessage(msg, args, data);
        } catch (error) {
            // Try to notify sender of command error
            try {
                await MessageUtils.send(
                    msg.channel,
                    Lang.getEmbed('errorEmbeds.command', data.lang(), {
                        ERROR_CODE: msg.id,
                    })
                );
            } catch {
                // Ignore
            }

            // Log command error
            Logger.error(
                msg.channel instanceof TextChannel ||
                    msg.channel instanceof NewsChannel ||
                    msg.channel instanceof ThreadChannel
                    ? Logs.error.commandGuild
                          .replaceAll('{MESSAGE_ID}', msg.id)
                          .replaceAll('{COMMAND_KEYWORD}', command.keyword(Lang.Default))
                          .replaceAll('{USER_TAG}', msg.author.tag)
                          .replaceAll('{USER_ID}', msg.author.id)
                          .replaceAll('{CHANNEL_NAME}', msg.channel.name)
                          .replaceAll('{CHANNEL_ID}', msg.channel.id)
                          .replaceAll('{GUILD_NAME}', msg.guild.name)
                          .replaceAll('{GUILD_ID}', msg.guild.id)
                    : Logs.error.commandOther
                          .replaceAll('{MESSAGE_ID}', msg.id)
                          .replaceAll('{COMMAND_KEYWORD}', command.keyword(Lang.Default))
                          .replaceAll('{USER_TAG}', msg.author.tag)
                          .replaceAll('{USER_ID}', msg.author.id),
                error
            );
        }
    }

    private find(input: string, langCode: LangCode): Command {
        return this.commands.find(command => command.regex(langCode).test(input));
    }

    private hasPermission(member: GuildMember, command: Command): boolean {
        // Debug option to bypass permission checks
        if (Debug.skip.checkPerms) {
            return true;
        }

        // Developers and members with "Manage Server" have permission for all commands
        if (
            member.permissions.has(Permissions.FLAGS.MANAGE_GUILD) ||
            Config.developers.includes(member.id)
        ) {
            return true;
        }

        // Check if member has required permissions for command
        if (!member.permissions.has(command.requireClientPerms)) {
            return false;
        }

        return true;
    }

    private async sendError(intr: BaseCommandInteraction, data: EventData): Promise<void> {
        try {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed('errorEmbeds.command', data.lang(), {
                    ERROR_CODE: intr.id,
                })
            );
        } catch {
            // Ignore
        }
    }
}
