var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var fs = require('fs');


function checkMulti() {
    res = getResFromFile('multiRolls.txt');
    if (res.length != 0) {
         return true;
    } else {
        return false;
    }
}

function addToFile(path, data) {
    fs.appendFile(path, data, function(err) {
        if (err) {
            return console.error(err);
        }
    });
}

function clearFile(path) {
    fs.writeFile(path, '', function(err) {
        if (err) {
            return console.error(err);
        }
    });
}

function playMulti() {
    var res = getResFromFile('multiRolls.txt');
    clearFile('multiRolls.txt');
    return res;
}

function isAlreadyInMulti(user) {
    var res = getResFromFile('multiRolls.txt');
    res = res.split('\n');
    var users = JSON.parse(res[0]);
    return users.includes(user);
}

function addUserToMulti(user) {
    var res = getResFromFile('multiRolls.txt');
    res = res.split('\n');
    var users = JSON.parse(res[0]);
    users.push(user);
    res[0] = JSON.stringify(users);
    clearFile('multiRolls.txt');
    addToFile('multiRolls.txt', res.join('\n'));
}

function getWinner(rolls) {
    var winner = [rolls[0]];
    var curr = rolls[0];

    for (i = 1; i < rolls.length; i++) {
        curr = rolls[i]; 
        if (parseInt(curr.roll) > parseInt(winner[0].roll)) {
            winner = [curr];
        } else if (parseInt(curr.roll) == parseInt(winner[0].roll)) {
            winner.push(curr);
        }
    }

    return winner;
}

function getResFromFile(path) {
    var data = fs.readFileSync(path);
    return data.toString();
}

function getWinMsg() {

    var poss = ["AND THE STUPID FUCKING WINNER IS ", "POG, YOU WIN ", "UwU YOU WON ", "Pogggggers "];
    return poss[Math.floor(Math.random() * poss.length)];

}

function getLossMsg() {

    var poss = ["The rest of you are malding manlets"];
    return poss[Math.floor(Math.random() * poss.length)];

}

function getStartAudio() {
	var poss = ["mountAndBlade.mp3"];
    return poss[Math.floor(Math.random() * poss.length)];
}

function getWinAudio() {
	var poss = ["chaturbateDing.mp3"];
    return poss[Math.floor(Math.random() * poss.length)];
}

function playMultiSound(flag) {
	
	if (flag == "start") {
		const dispatcher = connection
			.play("./" + getStartAudio()).on("error", error => console.error(error));
	} else {
		const dispatcher = connection
			.play("./" + getStartAudio()).on("finish", () => {
				channel.leave();
			}).on("error", error => console.error(error));
	}
}


// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '$') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            // !ping
            case 'roll':
                var rand = Math.floor(Math.random() * 101);
                bot.sendMessage({
                    to: channelID,
                    message: user + '\'s roll ->  ' + rand.toString()
                });
                break;
            case 'multi':
                if (checkMulti()) {
                    bot.sendMessage({
                        to: channelID,
                        message: "Roll already initiated! Join the roll with $join"
                    });
                } else {
                	const channel = user.voiceChannel;
					if(!channel) {
						return console.log("not in vc");
					}

					try {
						var connection = channel.join();
					} catch (err) {
						return console.log(err);
					}
                	playMultiSound("start");
                	playMultiSound(message.guild)
                    bot.sendMessage({
                        to: channelID,
                        message: 'Roll ends in 15 seconds, lock in your stupid fucking spot! -> type $join'
                    });
                    
                    addToFile('multiRolls.txt', JSON.stringify([]));
                    setTimeout(function() {

                        var result = playMulti(); 
                        result = result.split('\n');
                        result.shift();

                        var rolls = [];
                        var msg = '';

                        for (i = 0; i < result.length; i++) {
                            var curr = JSON.parse(result[i]);
                            rolls.push(curr);
                            msg += (curr.roll + ' <- ' + curr.user + '\'s roll' + "\n");
                        }

                        var winner = getWinner(rolls);
                        if (winner.length > 1) {
                            var tied = winner[0].user;
                            for (i = 1; i < winner.length; i++) {
                                tied += (' & ' + winner[i].user);
                            }
                            msg += 'THERE HAS BEEN A FUCKING TIE :/\nThe not so special wInnErS are ' + tied + '.';
                            msg += '\n\nPlay a tie breaker using the command $roll !';
                        
                        } else {
                            var winMsg = getWinMsg();
                            msg += (winMsg + winner[0].user + '!\n' + getLossMsg());

                        }
                        playMultiSound("win");
                        bot.sendMessage({
                            to: channelID,
                            message: msg
                        });
                    }, 15000);
                }
                break;
            case 'join':
                if (checkMulti()) {
                    if (!isAlreadyInMulti(user)) {
                        var rand = Math.floor(Math.random() * 101);
                        var dict = {"user": user, "roll": rand.toString()};
                        var msg = '\n' + JSON.stringify(dict);
                        addUserToMulti(user);
                        addToFile('multiRolls.txt', msg);
                    }
                } else {
                    bot.sendMessage({
                        to: channelID,
                        message: "No party roll currently running :,(  -> initiate with $multi"
                    });
                }
                break;
            case 'help':
                var msg = 'Gambler commands:\n\n\'$roll\' - Use to roll a random number between 0 and 100.\n\'$multi\' - Use to start a party roll, allows 15 seconds for any members to lock in their roll.\n\'$join\' - Used to lock in a roll during the 15 second party roll lock-in phase.\n\'$help\' - You\'re looking at it! Lists gambler commands and their uses.';
                bot.sendMessage({
                    to: channelID,
                    message: msg
                });
                break;
         }
     }
});