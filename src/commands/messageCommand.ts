import { Message, PermissionResolvable } from 'discord.js';
import { Keyword } from '../models/common';
import { EventData } from '../models/internal-models';
import { Command } from './command';

export interface MessageCommand extends Keyword,Command {
    requireDev: boolean;
    requireGuild: boolean;
    requirePerms: PermissionResolvable[];

    executeMessageCommand(msg: Message, args: string[], data: EventData): Promise<void>;
}
