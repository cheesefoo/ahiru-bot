import { DMChannel, Message, NewsChannel, Permissions, TextChannel } from 'discord.js-light';

import { CommandHandler, EventHandler, TriggerHandler } from '.';

export class MessageHandler implements EventHandler {
    private regx = /(https:\/\/)?(www\.)?(((discord(app)?)?\.com\/invite)|((discord(app)?)?\.gg))\/(?<invite>.+)/gm

    constructor(private commandHandler: CommandHandler, private triggerHandler: TriggerHandler) {}

    public async process(msg: Message): Promise<void> {
        // Don't respond to system messages or self
        if (msg.system || msg.author.id === msg.client.user.id) {
            return;
        }

        // Only handle messages from the following channel types
        if (
            !(
                msg.channel instanceof DMChannel ||
                msg.channel instanceof TextChannel ||
                msg.channel instanceof NewsChannel
            )
        ) {
            return;
        }
         
        let isDiscordInvite = this.regx.test(msg.content.toLowerCase().replace(/\s+/g, ''));
        if(isDiscordInvite){
            if(!msg.member.hasPermission(Permissions.FLAGS.KICK_MEMBERS)) {
                await msg.delete();
            }
        }

        // Process command
        let args = msg.content.split(' ');
        if (this.commandHandler.shouldHandle(msg, args)) {
            await this.commandHandler.process(msg, args);
            return;
        }

        // Process triggers
        await this.triggerHandler.process(msg, args);
    }
}
