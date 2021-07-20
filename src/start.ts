import { Bot } from './bot';
import {
    DevCommand,
    HelpCommand,
    PuzzleCommand,
    DeepLCommand,
    OCRCommand
} from './commands';
import {
    CommandHandler,
    GuildJoinHandler,
    GuildLeaveHandler,
    MessageHandler,
    ReactionHandler,
    TriggerHandler,
} from './events';
import { CustomClient } from './extensions';
import { JobService, Logger } from './services';

let Config = require('../config/config.json');
let Logs = require('../lang/logs.json');

async function start(): Promise<void> {
    let client = new CustomClient({
        // discord.js Options
        ws: { intents: Config.client.intents },
        partials: Config.client.partials,
        messageCacheMaxSize: Config.client.caches.messages.size,
        messageCacheLifetime: Config.client.caches.messages.lifetime,
        messageSweepInterval: Config.client.caches.messages.sweepInterval,

        // discord.js-light Options
        cacheGuilds: Config.client.caches.guilds,
        cacheRoles: Config.client.caches.roles,
        cacheEmojis: Config.client.caches.emojis,
        cacheChannels: Config.client.caches.channels,
        cacheOverwrites: Config.client.caches.overwrites,
        cachePresences: Config.client.caches.presences,
        disabledEvents: Config.client.disabledEvents,
    });

    // Commands
    let devCommand = new DevCommand();
    let puzzleCommand = new PuzzleCommand();
    let helpCommand = new HelpCommand(); 
    let deepLCommand = new DeepLCommand(); 
    let ocrCommand = new OCRCommand(); 

    // Event handlers
    let guildJoinHandler = new GuildJoinHandler();
    let guildLeaveHandler = new GuildLeaveHandler();
    let commandHandler = new CommandHandler(Config.prefix, helpCommand, [
        devCommand,
        puzzleCommand,
        deepLCommand,
        ocrCommand
    ]);
    let triggerHandler = new TriggerHandler([]);
    let messageHandler = new MessageHandler(commandHandler, triggerHandler);
    let reactionHandler = new ReactionHandler([]);

    let bot = new Bot(
        process.env.discord,
        client,
        guildJoinHandler,
        guildLeaveHandler,
        messageHandler,
        reactionHandler,
        new JobService([])
    );

    await bot.start();
    await client.setPresence('LISTENING','太陽少女|~help','https://music.youtube.com/playlist?list=OLAK5uy_lnTdmXQPPwyf1d4_6ytaZlplpjTmwaS-I');
}

process.on('unhandledRejection', (reason, promise) => {
    Logger.error(Logs.error.unhandledRejection, reason);
});

start().catch(error => {
    Logger.error(Logs.error.unspecified, error);
});
