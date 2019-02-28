const {
    Command
} = require('klasa');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            name: 'streamers',
            enabled: true,
            runIn: ['text'],
            cooldown: 0,
            deletable: false,
            bucket: 1,
            aliases: [],
            guarded: false,
            nsfw: false,
            permissionLevel: 6,
            requiredPermissions: [],
            requiredSettings: [],
            subcommands: false,
            description: 'Lists streamers added to your server.',
            quotedStringSupport: false,
            // usage: '',
            usageDelim: undefined,
            // extendedHelp: ''
        });
    }

    async run(message, [...params]) {
        // This is where you place the code you want to run for your command

        var userDirMixer = __dirname.replace("commands/Streaming", "streamers/mixer").replace(String.raw `\commands\Streaming`, String.raw `\streamers\mixer`)
        var userDirTwitch = __dirname.replace("commands/Streaming", "streamers/twitch").replace(String.raw `\commands\Streaming`, String.raw `\streamers\twitch`)
        const fs = require("fs");
        var guildID = message.guild.id

        fs.readdir(userDirMixer, (err, files) => {
            files.forEach(file => {
                var files = file;
            });
            var fileCount = files.length;
            var myStreamersMixer = "Current **Mixer** Streamer List:\n";
            var i;
            for (i = 0; i < fileCount; i++) {
                var serverList = fs.readFileSync(userDirMixer + "/" + files[i]);
                if (serverList.includes(guildID)) {
                    var name = JSON.parse(serverList).name
                    // var name = files[i].replace(".json", "");
                    var myStreamersMixer = myStreamersMixer + name + "\n";
                }
            }
            message.channel.send(myStreamersMixer);
        });



        fs.readdir(userDirTwitch, (err, files) => {
            files.forEach(file => {
                var files = file;
            });
            var fileCount = files.length;
            var myStreamersTwitch = "Current **Twitch** Streamer List:\n";
            var ip;
            for (ip = 0; ip < fileCount; ip++) {
                var serverList = fs.readFileSync(userDirTwitch + "/" + files[ip]);
                if (serverList.includes(guildID)) {
                    var name = files[ip].replace(".json", "");
                    var myStreamersTwitch = myStreamersTwitch + name + "\n";
                }
            }
            message.channel.send(myStreamersTwitch);
        });
    }
};