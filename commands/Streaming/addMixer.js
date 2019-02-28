const {
    Command
} = require('klasa');

//some more big boi stuff. ?addmixer works fine but ?addtwitch needs some tweeks.

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            name: 'addMixer',
            enabled: true,
            runIn: ['text'],
            cooldown: 0,
            deletable: false,
            bucket: 1,
            aliases: [],
            guarded: false,
            nsfw: false,
            permissionLevel: 5, //any one with admin perms
            requiredPermissions: [],
            requiredSettings: ['mixerLiveChannel'],
            subcommands: false,
            description: 'Used to add a Mixer streamer to your server.',
            quotedStringSupport: false,
            // usage: '',
            usageDelim: undefined
            // extendedHelp: 'No extended help available.'
        });
    }

    async run(message, [...params]) {
        // This is where you place the code you want to run for your command
        const fs = require('fs')
        const fetch = require('node-fetch')

        var prefix = message.guild.settings.prefix
        var args = message.content.toString().toLowerCase().replace(prefix + 'addmixer', '').split(' ')
        var streamer = args[1]

        var mixerDir = __dirname.replace("commands/Streaming", "streamers/mixer").replace(String.raw `\commands\Streaming`, String.raw `\streamers\mixer`)
        var streamerDir = __dirname.replace("commands/Streaming", "streamers").replace(String.raw `\commands\Streaming`, String.raw `\streamers`);
        // var mixerDir = __dirname.replace("commands/Streaming", "streamers/mixer");
        // var streamerDir = __dirname.replace("commands/Streaming", "streamers");
        var guildID = message.guild.id


        function checkStatus(res) {
            if (res.ok) { // res.status >= 200 && res.status < 300
                return res;
            } else {
                return message.reply(`There is no registered Mixer account with the name ${streamer}`)
            }
        }

        function liveMixer(name, game, status, logo, followers, views, level, id) {

            var mixerDir = "./streamers/mixer"
            const Discord = require('discord.js');
            const {
                MessageEmbed
            } = require('discord.js');
            require('discord.js-aliases');
            const fs = require('fs')

            const liveEmbed = new Discord.MessageEmbed() //start the embed message template
                .setTitle(name + "\'s Stream")
                .setAuthor(status)
                .setColor(0x9900FF)
                .setDescription("Hey guys, " + name + " is live on Mixer right now! Click above to watch!")
                .setFooter("Sent via TheReaper")
                .setThumbnail(logo)
                .setTimestamp()
                .setURL("http://mixer.com/" + name)
                .addField("Streaming", game)
                .addField("Followers", followers, true)
                .addField("Mixer Level", level, true)
                .addField("Total Views", views, true); //end the embed message template

            var serversAllowedRaw = fs.readFileSync(mixerDir + "/" + id + ".json");
            var streamerData = JSON.parse(serversAllowedRaw);
            var serversAllowed = streamerData.guilds.toString().split(',')

            var mi;
            for (mi = 0; mi < serversAllowed.length; mi++) { //run for the total number of servers they are allowed on

                if (this.guilds.map(c => c.id).includes(serversAllowed[mi])) {

                    var guild_id = serversAllowed[mi]

                    if (this.guilds.get(guild_id) != undefined) {

                        var gSettings = this.guilds.get(guild_id).settings

                        if (gSettings.mixerLiveChannel != undefined) {
                            var channelID = gSettings.mixerLiveChannel

                            if (channelID == null) {
                                //  = this.guilds.get(guild_id).channels.find("name", settings.welcomeChannel).send
                                var channelID = this.guilds.get(guild_id).channels.find(channel => channel.name === 'general').id;
                                var liveMessage = "";

                                if (gSettings.livePing == false) {
                                    var liveMessage = liveMessage
                                }
                                if (gSettings.livePing == true) {
                                    var liveMessage = liveMessage + "@here, "
                                }
                                var liveMessage = liveMessage + name + " is now live on Mixer!"

                                this.channels.get(channelID).sendEmbed(liveEmbed, liveMessage); //send the live message to servers
                            } else {
                                var liveMessage = "";

                                if (gSettings.livePing == false) {
                                    var liveMessage = liveMessage
                                }
                                if (gSettings.livePing == true) {
                                    var liveMessage = liveMessage + "@here, "
                                }
                                var liveMessage = liveMessage + name + " is now live on Mixer!"

                                this.channels.get(channelID).sendEmbed(liveEmbed, liveMessage); //send the live message to servers
                            }

                        }


                    }



                }
            }

        }

        fetch(`https://mixer.com/api/v1/channels/${streamer}`)
            .then(checkStatus)
            .then(res => res.json())
            .then(
                mixerInfo => {
                    const mixerID = mixerInfo.id;
                    if (!fs.existsSync(mixerDir + '/' + mixerID + '.json')) { //if they are not in the database
                        let defaultMixer = {
                            name: mixerInfo.token,
                            id: mixerInfo.id,
                            userid: mixerInfo.userid,
                            liveTime: '0',
                            guilds: [message.guild.id]
                        };
                        let mixerJSON = JSON.stringify(defaultMixer);
                        fs.writeFileSync(mixerDir + '/' + mixerID + '.json', mixerJSON);

                        var curMixer = fs.readFileSync(streamerDir + '/mixerStreamers.txt', "utf-8")
                        var newMixer = mixerID + ', ' + curMixer

                        fs.writeFileSync(streamerDir + '/mixerStreamers.txt', newMixer)

                        const Carina = require("carina").Carina;
                        const ws = require("ws");

                        Carina.WebSocket = ws;
                        const ca = new Carina({
                            isBot: true
                        }).open();

                        function mixerJSONF(id) {

                            var rawdata = fs.readFileSync(mixerDir + "/" + id + ".json");
                            this.streamerData = JSON.parse(rawdata);

                            // return streamerData;
                        }


                        var halfHour = 1800000; //time in milis that is 30min
                        var bootTime = (new Date).getTime(); //get the time the bot booted up
                        var halfHourAgo = bootTime - 1800000; //get the time 30min before the boot

                        // mixerID
                        ca.subscribe(`channel:${mixerID}:update`, data => { //subscribing to the streamer
                            if (data.online == true && data.updatedAt != undefined) {
                                var mixerStatus = data.online; //checks if they are online (its a double check just incase the above line miss fires)
                                if (mixerStatus == true) { //if the info JSON says they are live
                                    var liveTime = (new Date).getTime(); //time the bot sees they went live
                                    // var rawdata = fs.readFileSync(streamerFolderMixer + "/" + streamersMixer[i] + ".json");
                                    // var streamerData = JSON.parse(rawdata);
                                    var mixer_id = mixerID.toString()
                                    var mixerD = new mixerJSONF(mixer_id)
                                    // console.log(mixerD.streamerData)
                                    var lastLiveTime = mixerD.streamerData.liveTime;

                                    // var lastLiveTime = fs.readFileSync("./mixer_time/" + mixerInfo.token + "_time.txt", "utf-8"); //checks the last live time
                                    // var timeDiff = liveTime - lastLiveTime; //gets the diff of current and last live times


                                    var timeDiff = liveTime - lastLiveTime; //gets the diff of current and last live times
                                    // console.log(liveTime)
                                    // console.log(lastLiveTime)
                                    // console.log(timeDiff)


                                    if (timeDiff >= halfHour) { //if its been 30min or more
                                        // console.log(chalk.cyan(streamerData.name + " went live, as its been more than 30min!" + client.shard.id)); //log that they went live

                                        // client.shard.broadcastEval(client.liveMixer(mixerInfo.token)) //should tell all shards to do the following

                                        var args = [mixerInfo.token, mixerInfo.type.name, mixerInfo.name, mixerInfo.user.avatarUrl, mixerInfo.numFollowers, mixerInfo.viewersTotal, mixerInfo.user.level, mixerInfo.id]
                                        var v = JSON.stringify(args)
                                        this.client.shard.broadcastEval(`(${liveMixer}).apply(this, ${JSON.stringify(args)})`)

                                        if (mixerInfo.token == mixerD.streamerData.name) {
                                            mixerD.streamerData.liveTime = liveTime
                                            fs.writeFileSync(mixerDir + '/' + mixerID + '.json', JSON.stringify(mixerD.streamerData));
                                        } else {
                                            mixerD.streamerData.name = mixerInfo.token
                                            mixerD.streamerData.liveTime = liveTime
                                            fs.writeFileSync(mixerDir + '/' + mixerID + '.json', JSON.stringify(mixerD.streamerData));
                                        }

                                    }


                                    if (timeDiff < halfHour) { //if its been less than 30min
                                        // console.log(mixerInfo.token + " attempted to go live, but its been under 30min!"); //log that its been under 30min
                                    }


                                    // delay(10).then(() => {
                                    // fs.writeFile("./mixer_time/" + mixerInfo.token + "_time.txt", liveTime); //update last live time regardless if they went live or not
                                    // });
                                    // fs.writeFile("./mixer_time/" + mixerInfo.token + "_time.txt", liveTime); //update last live time regardless if they went live or not
                                }
                            }





                        });



                        return message.reply(`you have added ${mixerInfo.token} on Mixer to your server!`)

                    }
                    if (fs.existsSync(mixerDir + '/' + mixerID + '.json')) { //if they are in the database
                        let rawdata = fs.readFileSync(mixerDir + '/' + mixerID + '.json');
                        let streamerData = JSON.parse(rawdata);
                        if (streamerData.guilds.includes(guildID)) { //if they are already added to that server
                            return message.reply(`the Mixer streamer ${mixerInfo.token} has already been added to your server!`)
                        }
                        if (!streamerData.guilds.includes(guildID)) { //if they are not already added to that server
                            var oldGuilds = streamerData.guilds
                            oldGuilds.push(guildID)
                            streamerData.guilds = oldGuilds

                            fs.writeFileSync(mixerDir + '/' + mixerID + '.json', JSON.stringify(streamerData));
                            return message.reply(`you have added ${mixerInfo.token} on Mixer to your server!`)
                        }
                    }
                })
            }
        };