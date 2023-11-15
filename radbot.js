import {KoLBot} from "kol-chatbot";
//import {KoLClient} from "kol-chatbot/dist/KoLClient.js";
import sqlite3 from "sqlite3";
import {DateTime} from "luxon";
import { dedent } from "ts-dedent";
import * as dotenv from "dotenv";
import {get_info} from "./get_youtube.js";
//import time from "time";
dotenv.config();
//import { promisify } from "util";

const apiKey = process.env.apiKey;
const username = process.env.USER;
const password = process.env.PASS;
//const getYoutubeVideoInfo = require('./getYoutubeVideoInfo');

// Create SQLite object
let db = new sqlite3.Database('./chat.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the chat database.');
});

  // Credentials
const chatbot = new KoLBot(username, password)

// Promisify query (prevents callbacks)h
//const query = promisify(db.all).bind(db);

// Function to hopefully check for numerics
function isNumeric(value) {
    return /^\d+$/.test(value);
}

// Usage instructions for 'help' command
function help() {
    return dedent`
        Sup sup, call me RadBot. Say my name and a magic word:
        help: Well, you get it. Check back on my profile occasionally for updates.
        last [quantity]: Kmail you the last [quantity] (20 or less) youtube links posted in /radio.
        -ex: "radbot last 5"
        shuffle [quantity]: Kmail you a mix of [quantity] (20 or less) youtube links from the /radio database.
        -ex: "radbot shuffle 5"
        spit ["short"|"long"]: I'll spit out a random song from the database into /radio chat.
        -ex: "radbot spit" for songs 17m or less
        -ex: "radbot spit short" for songs 6m or less
        -ex: "radbot spit long" for songs 17m or more
    `;
};

async function get_link(command,nlinks) {
    console.log(command)
    console.log(nlinks)
    let sql;
    switch (command) {
        case "last":
            sql = "SELECT DISTINCT name, link, nsfw FROM youtube ORDER BY rowid DESC LIMIT "+nlinks+";";
            break;
        case "shuffle":
            sql = "SELECT y.name, y.link, y.nsfw FROM youtube y INNER JOIN (SELECT DISTINCT name, vid_id FROM youtube) v ON y.name = v.name AND y.vid_id = v.vid_id ORDER BY RANDOM() LIMIT "+nlinks+";";
            break;
        case "spit":
            if (nlinks == "long") {
                sql = "SELECT y.name, y.link, y.nsfw FROM youtube y INNER JOIN (SELECT DISTINCT name, vid_id FROM youtube WHERE duration >= '00:17:00') v ON y.name = v.name AND y.vid_id = v.vid_id ORDER BY RANDOM() LIMIT 1;";
            } else if (nlinks == "short") {
                sql = "SELECT y.name, y.link, y.nsfw FROM youtube y INNER JOIN (SELECT DISTINCT name, vid_id FROM youtube WHERE duration <= '00:06:00') v ON y.name = v.name AND y.vid_id = v.vid_id ORDER BY RANDOM() LIMIT 1;";
            } else {
                sql = "SELECT y.name, y.link, y.nsfw FROM youtube y INNER JOIN (SELECT DISTINCT name, vid_id FROM youtube WHERE duration <= '00:17:00') v ON y.name = v.name AND y.vid_id = v.vid_id ORDER BY RANDOM() LIMIT 1;";
            }
            break;
    };
    

    console.log("SQL query:", sql);

    return new Promise((resolve, reject) => {
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error(err.message);
                reject(err);
            }
            
            // const links = rows.map(row => row.name + ": " + row.link).join("\n");
            const links = rows.map(row => {
                if (row.nsfw == "true") {
                    return "[NSFW] " + row.name + ": " + row.link;
                } else {
                    return row.name + ": " + row.link;
                }
            }).join("\n");
            console.log(links);
            resolve(links);
        });
    });
}

// Begin main chatbot function.
// Ideally would break this up into further functions sooner than later.
chatbot.start(async (response) => {

    const timestamp = DateTime.now().toFormat("y'-'MM'-'dd' 'TT").toString();

    const { who, msg } = response;

    let link = "";
    console.log(timestamp)
    console.log(response)
    console.log(link)

    
   //   chatbot.sendKmail()
   // if (who.id === '643499') {
   //   return response.reply(
   //     `I hope this reply gets through.
   //     
   //     I hope adding line breaks didn't make it weird.`
   //   )
   // }
    const args = msg.split(" ");
    //console.log(args)

    if (args[0].toLowerCase() == 'radbot') {
    switch (args[1].toLowerCase()) {
        case "help":
            await chatbot.sendKmail(who.id, help());
            chatbot.sendMessage("/em just sent you a kmail with instructions");
        case "last":
            if (args[1].toLowerCase() == 'last' && isNumeric(args[2]) && args[2] < 21) {
              //await bot.sendKmail(id, (args[2]));
                const args_1 = args[1].toLowerCase();
                const links = await get_link(args_1, args[2]);
                await chatbot.sendKmail(who.id, links);
                //linksCache = null;
                
                
              //chatbot.sendKmail(who.id, get_link(args[2]));
            } else if (isNumeric(args[2]) && parseInt(args[2]) >= 21) {
                return response.reply(
                    `Man that's too many links right now. I only got 20 hands.`
                );
            } else if (args[1].toLowerCase() == 'last' && !isNumeric(args[2])) {
                return response.reply(
                `Did you mean 'RadBot last 5' or something?`
                );
            };
            break;
        case "shuffle":
            if (args[1].toLowerCase() == 'shuffle' && isNumeric(args[2]) && parseInt(args[2]) < 21) {
                //await bot.sendKmail(id, (args[2]));
                //console.log(args[2])
                const args_1 = args[1].toLowerCase();
                const links = await get_link(args_1, parseInt(args[2]));
                chatbot.sendKmail(who.id, links);
                //linksCache = null;
                //chatbot.sendKmail(who.id, get_link(args[2]));
            } else if (isNumeric(args[2]) && parseInt(args[2]) >= 21) {
                return response.reply(
                    `Man that's too many links right now. I only got 20 hands.`
                );
            } else if (!isNumeric(args[2])) {
                return response.reply(
                `Did you mean 'RadBot last 5' or something?`
                );
            };
            break;
        case "spit":
            if (args[1].toLowerCase() == "spit" && isNumeric(args[2])) {
                return response.reply(
                    `Are you trying to get me in trouble? I hock em one at a time friend.`
                );
                //console.log("Whelp")
            } else if (args[1].toLowerCase() == "spit" && (args[2].toLowerCase() == "long" || args[2].toLowerCase() == "short")) {
                const args_1 = args[1].toLowerCase();
                const args_2 = args[2].toLowerCase();
                const spit = await get_link(args_1, args_2);
                console.log(spit)
                return response.reply(spit);
            } else {
                const args_1 = args[1].toLowerCase();
                const spit = await get_link(args_1);
                console.log(spit)
                //console.log(get_link(args[1]))
                return response.reply(spit);
                //chatbot.sendWhisper(who.id, get_link(args[1]));

            };
            break;
    };
    
};


    // Link handling, please move into its own function soon.
    if (msg.includes("http") && !msg.includes("showplayer")) {
        const link_regex = /(https?:\/\/[^\s]+(?="))/g;
        const file_regex = /(gif|png|jpg)/;
        const matches = msg.match(link_regex);

        if (matches) {
            if (file_regex.test(matches[0]) && (matches.length == 3)) {
                link = matches[1]
            } else if (matches.length == 1) {
                link = matches[0]
            }
        } else {
            link = ""
        }
        console.log(timestamp);
        console.log(response);
        console.log(link);
    }


    const youtube_test = /(youtu.*be.*)\/((watch\?v=|live\/)|embed\/|v|shorts|)(?!.*playlist)(.*?((?=[&#?])|$))/;

    if (link && !msg.toLowerCase().includes("showplayer") && youtube_test.test(link)) {
        // if youtube video, obtain id
        const vid_id_regex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtube\.com\/live\/|youtube\.com\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11}).*$/;
        const vid_id = vid_id_regex.exec(link)[1];
        console.log(vid_id);

        const videoInfo = await get_info(vid_id, apiKey)
        .catch(err => {
            console.error(err);
        });

        const title = videoInfo['title'];
        const duration = videoInfo['duration'];
        const thumbnail = videoInfo['thumbnail'];

        let nsfw;
        if (msg.toLowerCase().includes("nsfw")) {
            nsfw = "true";
        } else {
            nsfw = "false";
        };
        
      // Insert data into SQLite database
        db.run(`INSERT INTO youtube (timestamp, name, player_id, link, vid_id, title, duration, thumbnail, nsfw) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [timestamp, who.name, who.id, link, vid_id, title, duration, thumbnail, nsfw], function(err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`[${timestamp}] YouTube Link inserted successfully`);
        });

        // Just a fun easter egg response when a certain number of videos has been reached.
        async function row_count() {
            const rowCount = await runQuery(db, 'SELECT COUNT(*) as rowCount FROM youtube');
            console.log(`The number of rows in youtube is: ${rowCount.rowCount}`);
            switch (rowCount.rowCount) {
                case 1111:
                    console.log('better switch up that attitude');
                    return response.reply(
                        `1111 songs? (That's ridiculous. It's not even funny.)^2`
                    );
                    break;
                case 1234:
                    console.log('OCD baby');
                    return response.reply(
                        `1234 crunchy jams. This sequence pleases the circuits.`
                    );
                    break;
                case 1337:
                    console.log('31337 64M3R');
                    return response.reply(
                        `Thank you for the 1337th banger. Witness my final form, n00b.`
                    );
                    break;
                case 1776:
                    console.log('CAWCAW');
                    return response.reply(
                        `1776 straight5 hits played? Time for the revolution!`
                    );
                    break;
                case 2023:
                    console.log('Oh hey');
                    return response.reply(
                        `RadBot's Log: Songs, 2023. This is the hottest track I've ever heard.`
                    );
                    break;
                case 4000:
                    console.log('Jammin in 4k');
                    return response.reply(
                        `Thank you kind Loather for song #4000. Now we're jammin' in 4K.`
                    );
                    break;
                case 5000:
                    console.log('Ran a 5k!');
                    return response.reply(
                        `/em *huff* *huff* has just finished their first 5k. Keep em coming!`
                    );
                    break;
                    case 5054:
                        console.log('Heads or tails');
                        return response.reply(
                            `5050 huh? I'll take those odds.`
                        );
                        break;
            }
        };
        
        function runQuery(db, query) {
            return new Promise((resolve, reject) => {
                db.get(query, (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                });
            });
        }

        row_count().catch((err) => {
            console.error('Error: ', err.message);
        });

    } else if (link && !msg.toLowerCase().includes("showplayer")) {
        // Insert data into SQLite database
        db.run(`INSERT INTO nontube (timestamp, name, player_id, link) VALUES (?, ?, ?, ?)`, [timestamp, who.name, who.id, link], function(err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`[${timestamp}] non-YT Link inserted successfully`);
    });
    } else {
        console.log(`Didn't pass youtube test section.`)
    }


});
