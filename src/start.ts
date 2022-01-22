import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { Options } from 'discord.js';
import { createRequire } from 'node:module';

import { Bot } from './bot.js';
import { Button } from './buttons/index.js';
import {
    Command,
    DeepLCommand,
    HelpCommand,
    JishoCommand,
    OCRCommand,
    PuzzleCommand,
    SubtitleCommand,
} from './commands/index.js';
import {
    ButtonHandler,
    CommandHandler,
    GuildJoinHandler,
    GuildLeaveHandler,
    MessageHandler,
    ReactionHandler,
    TriggerHandler,
} from './events';
import { CustomClient } from './extensions';
import { CheckInstagram, CheckTwitter } from './jobs';
import { Job } from './jobs/index.js';
import { Reaction } from './reactions/index.js';
import { JobService, Logger } from './services';
import { AMSRTrigger } from './triggers/AMSRTrigger';
import { Trigger } from './triggers/index.js';

const require = createRequire(import.meta.url);

let Config = require('../config/config.json');
let Logs = require('../lang/logs.json');

async function start(): Promise<void>
{
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

    let commands: Command[] = [
        new HelpCommand(),
        // TODO: Add new commands here
        new OCRCommand(),
        new DeepLCommand(),
        // new PuzzleCommand(),
        new JishoCommand(),
        new SubtitleCommand(),
    ].sort((a, b) => (a.metadata.name > b.metadata.name ? 1 : -1));

    // Buttons
    let buttons: Button[] = [
        // TODO: Add new buttons here
    ];

    // Reactions
    let reactions: Reaction[] = [
        // TODO: Add new reactions here
    ];

    // Triggers
    let triggers: Trigger[] = [
        // TODO: Add new triggers here
        new AMSRTrigger()
    ];

    // Event handlers
    let guildJoinHandler = new GuildJoinHandler();
    let guildLeaveHandler = new GuildLeaveHandler();
    let commandHandler = new CommandHandler(Config.prefix, new HelpCommand(), commands);
    let buttonHandler = new ButtonHandler(buttons);
    let triggerHandler = new TriggerHandler(triggers);
    let messageHandler = new MessageHandler(commandHandler, triggerHandler);
    let reactionHandler = new ReactionHandler(reactions);

    // Jobs
    let jobs: Job[] = [
        // TODO: Add new jobs here
        new CheckInstagram(client),
        new CheckTwitter(client),
    ];
    const token = process.env.discord_token;

    // Bot
    let bot = new Bot(
        token,
        client,
        guildJoinHandler,
        guildLeaveHandler,
        messageHandler,
        commandHandler,
        buttonHandler,
        reactionHandler,
        new JobService(jobs),
    );

    // Register
    if (process.argv[2] === '--register')
    {
        await registerCommands(commands);
        process.exit();
    }

    await bot.start();
}

async function registerCommands(commands: Command[]): Promise<void>
{
    let cmdDatas = commands.map(cmd => cmd.metadata);
    let cmdNames = cmdDatas.map(cmdData => cmdData.name);

    Logger.info(
        Logs.info.commandsRegistering.replaceAll(
            '{COMMAND_NAMES}',
            cmdNames.map(cmdName => `'${cmdName}'`).join(', '),
        ),
    );

    try
    {
        const token = process.env.discord_token;
        let id = '824488445811490827';
        let rest = new REST({ version: '9' }).setToken(token);
        await rest.put(Routes.applicationCommands(id), { body: [] });
        await rest.put(Routes.applicationCommands(id), { body: cmdDatas });
    } catch (error)
    {
        Logger.error(Logs.error.commandsRegistering, error);
        return;
    }

    Logger.info(Logs.info.commandsRegistered);
}

process.on('unhandledRejection', (reason, _promise) =>
{
    Logger.error(Logs.error.unhandledRejection, reason);
});

start().catch(error =>
{
    Logger.error(Logs.error.unspecified, error);
});
