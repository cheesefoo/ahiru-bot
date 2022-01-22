import {
    CommandInteraction,
    GuildMember,
    Interaction,
    Message,
    NewsChannel,
    Permissions,
    TextChannel,
    ThreadChannel,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';
import { createRequire } from 'node:module';

import { Command } from '../commands';
import { LangCode } from '../models/enums';
import { EventData } from '../models/internal-models';
import { Lang, Logger } from '../services';
import { MessageUtils, PermissionUtils } from '../utils';

import { CommandHandler, EventHandler } from '.';
const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');
let Debug = require('../../config/debug.json');
let Logs = require('../../lang/logs.json');

export class InteractionHandler implements EventHandler {
    constructor(private commandHandler: CommandHandler) {}

    private rateLimiter = new RateLimiter(
        Config.rateLimiting.commands.amount,
        Config.rateLimiting.commands.interval * 1000
    );

    public async process(interaction: CommandInteraction): Promise<void> {
        /*  // Check if user is rate limited
         let limited = this.rateLimiter.take(interaction.user.id);
         if (limited) {
             return;
         }
         
      
         const { commandName } = interaction;
 
         if (commandName === 'ping') {
             await interaction.reply('Pong!');
         } else if (commandName === 'server') {
             await interaction.reply('Server info.');
         } else if (commandName === 'user') {
             await interaction.reply('User info.');
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
             await this.helpCommand.execute(msg, args, data);
             return;
         }
 
         // Try to find the command the user wants
         let command = this.find(args[1], data.lang());
 
         // If no command found, run the help command
         if (!command) {
             await this.helpCommand.execute(msg, args, data);
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
             await command.execute(msg, args, data);
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
         } */
    }

    /*    private find(input: string, langCode: LangCode): Command {
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
           if (!member.permissions.has(command.requirePerms)) {
               return false;
           }
   
           return true;
       } */
}
