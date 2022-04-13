import { Message } from 'discord.js';
import { EventData } from '../models/internal-models';
import { MessageUtils, PermissionUtils } from '../utils';
import { Trigger } from './trigger';

export class AMSRTrigger implements Trigger {
    public requireGuild = true;

    public triggered(msg: Message): boolean {
        // Check prerequisite permissions needed for execute
        if (!(PermissionUtils.canReact(msg.channel) || PermissionUtils.canSend(msg.channel))) {
            return false;
        }

        let input = MessageUtils.content(msg);
        return input.match(/amsr/i) !== null;
    }

    public async execute(msg: Message, data: EventData): Promise<void> {
        if (PermissionUtils.canReact(msg.channel)) {
            // @ts-ignore
            MessageUtils.react(msg, '🅰️')
                .then(() => MessageUtils.react(msg, '🇸'))
                .then(() => MessageUtils.react(msg, 'Ⓜ'))
                .then(() => MessageUtils.react(msg, '🇷'));
        }
    }
}
