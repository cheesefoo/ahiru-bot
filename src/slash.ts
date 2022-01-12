const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
let Config = require('../config/config.json');

const fs = require('fs');
const path = require('path');

const dirPath = path.resolve(__dirname, '../dist/commands');
const commands = [];
const commandFiles = fs.readdirSync(dirPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(Config.client.token);
const CLIENT_ID = Config.client.id;
const GUILD_ID = '821113829530402909';

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
