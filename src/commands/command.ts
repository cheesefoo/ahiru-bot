import {
    ApplicationCommandData,
    BaseCommandInteraction,
    CommandInteraction,
    Message,
    PermissionString,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { EventData } from '../models/internal-models.js';

export interface Command {
    metadata: ApplicationCommandData;
    cooldown?: RateLimiter;
    deferType: CommandDeferType;
    requireDev: boolean;
    requireGuild: boolean;
    requireClientPerms: PermissionString[];
    requireUserPerms: PermissionString[];
    execute(intr: BaseCommandInteraction, data: EventData): Promise<void>;
    executeMessage(msg: Message, args: string[], data: EventData): Promise<void>;
    regex?: any;
    keyword?: any;
}

export enum CommandDeferType {
    PUBLIC = 'PUBLIC',
    HIDDEN = 'HIDDEN',
    NONE = 'NONE',
}
