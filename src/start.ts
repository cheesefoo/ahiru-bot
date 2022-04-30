// index.js

// This allows TypeScript to detect our global value
declare global
{
    namespace NodeJS
    {
        interface Global
        {
            __rootdir__: string;
        }
    }
}

global.__rootdir__ = process.cwd();
import { REST } from '@discordjs/rest';
import { RewriteFrames } from '@sentry/integrations';
import * as Sentry from '@sentry/node';
// Importing @sentry/tracing patches the global hub for tracing to work.
import '@sentry/tracing';
import { Routes } from 'discord-api-types/v9';
import { Options } from 'discord.js';
import { HolodexApiClient } from 'holodex.js';
import { createRequire } from 'node:module';

import { Bot } from './bot.js';
import { Button } from './buttons';
import {
    Command,
    DeepLCommand,
    HelpCommand,
    JishoCommand,
    OCRCommand,
    RelayCommand,
    SubtitleCommand,
} from './commands';
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
import { CheckInstagram, CheckTwitter, Job } from './jobs';
import { CheckHolodex } from './jobs/check-holodex';
import { Reaction } from './reactions';
import { JobService, Logger } from './services';
import { Relay } from './services/relay';
import { Trigger } from './triggers';
import { AMSRTrigger } from './triggers/AMSRTrigger';

const require = createRequire(import.meta.url);

let Config = require('../config/config.json');
let Logs = require('../lang/logs.json');

async function start(): Promise<void>
{
    Sentry.init({
        dsn: 'https://284c7e02c17f4e33b15de7d0accb4eaf@o559712.ingest.sentry.io/6327267',
        integrations: [
            new RewriteFrames({
                root: global.__rootdir__,
            }),
        ],
        // We recommend adjusting this value in production, or using tracesSampler
        // for finer control
        tracesSampleRate: 1.0,
    });
    const transaction = Sentry.startTransaction({
        op: 'test',
        name: 'My First Test Transaction',
    });

    setTimeout(() =>
    {
        try
        {
            throw 'exception'
        } catch (e)
        {
            Sentry.captureException(e);
        } finally
        {
            transaction.finish();
        }
    }, 99);

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

    let holodexClient = new HolodexApiClient({
        apiKey: process.env.holodex_api,
    });
    let relayService = new Relay(client);
    // Commands

    let commands: Command[] = [
        new HelpCommand(),
        // TODO: Add new commands here
        new OCRCommand(),
        new DeepLCommand(),
        // new PuzzleCommand(),
        new RelayCommand(holodexClient,relayService),
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
        new AMSRTrigger(),
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
        new CheckHolodex(client,holodexClient,relayService),
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
        await registerCommands([new OCRCommand(), new DeepLCommand()]);
        process.exit();
    }

    // let webhookController = new WebhookEndpoint(client);
    // let api = new Api([webhookController]);

    // await api.start();
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
