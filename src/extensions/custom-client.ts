import { ActivityType, Client, ClientOptions, Presence } from 'discord.js';
import { RelaySetting } from '../models/discord/servers';

export class CustomClient extends Client
{
    public relaySettings:RelaySetting[];

    constructor(clientOptions: ClientOptions, relaySettings?: RelaySetting[])
    {
        super(clientOptions);
        this.relaySettings = relaySettings;
    }

    public setPresence(type: ActivityType, name: string, url: string): Presence
    {
        return this.user?.setPresence({
            activities: [
                {
                    // TODO: Discord.js won't accept all ActivityType's here
                    // Need to find a solution to remove "any"
                    type: type as any,
                    name,
                    url,
                },
            ],
        });
    }

}
