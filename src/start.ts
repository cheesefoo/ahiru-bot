import { Options } from 'discord.js';

import { Bot } from './bot';
import {
    DeepLCommand,
    DevCommand,
    DocsCommand,
    HelpCommand,
    InfoCommand,
    InviteCommand,
    JishoCommand,
    OCRCommand,
    PuzzleCommand,
    SupportCommand,
    TestCommand,
    TranslateCommand,
    VoteCommand,
} from './commands';
import {
    CommandHandler,
    GuildJoinHandler,
    GuildLeaveHandler,
    InteractionHandler,
    MessageHandler,
    ReactionHandler,
    TriggerHandler,
} from './events';
import { CustomClient } from './extensions';
import { CheckInstagram } from './jobs';
import { HttpService, JobService, Logger } from './services';

let Config = require('../config/config.json');
let Logs = require('../lang/logs.json');

async function start(): Promise<void> {
    let client = new CustomClient({
        intents: Config.client.intents,
        partials: Config.client.partials,
        makeCache: Options.cacheWithLimits({
            // Keep default caching behavior
            ...Options.defaultMakeCacheSettings,
            // Override specific options from config
            ...Config.client.caches,
        }),
    });

    // Commands
    let devCommand = new DevCommand();
    let docsCommand = new DocsCommand();
    let helpCommand = new HelpCommand();
    let infoCommand = new InfoCommand();
    let inviteCommand = new InviteCommand();
    let supportCommand = new SupportCommand();
    let testCommand = new TestCommand();
    let translateCommand = new TranslateCommand();
    let voteCommand = new VoteCommand();
    let ocrCommand = new OCRCommand();
    let deepLCommand = new DeepLCommand();
    let puzzleCommand = new PuzzleCommand();
    let jishoCommand = new JishoCommand();

    // Event handlers
    let guildJoinHandler = new GuildJoinHandler();
    let guildLeaveHandler = new GuildLeaveHandler();
    let commandHandler = new CommandHandler(Config.prefix, helpCommand, [
        devCommand,
        puzzleCommand,
        deepLCommand,
        ocrCommand,
        jishoCommand,
        voteCommand
    ]);

    let triggerHandler = new TriggerHandler([]);
    let messageHandler = new MessageHandler(commandHandler, triggerHandler);
    let reactionHandler = new ReactionHandler([]);
    let interactionHandler = new InteractionHandler(commandHandler);

    let httpService = new HttpService();
    let jobService = new JobService([new CheckInstagram(httpService, client)])

    let bot = new Bot(
        Config.client.token,
        client,
        guildJoinHandler,
        guildLeaveHandler,
        messageHandler,
        reactionHandler,
        new JobService([]),
        interactionHandler
    );

    await bot.start();
}

process.on('unhandledRejection', (reason, promise) => {
    Logger.error(Logs.error.unhandledRejection, reason);
});

start().catch(error => {
    Logger.error(Logs.error.unspecified, error);
});
