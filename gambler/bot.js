var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var fs = require('fs');
var ffmpeg = require("ffmpeg");


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

function isAlreadyInMulti(userID) {
    var res = getResFromFile('multiRolls.txt');
    res = res.split('\n');
    var users = JSON.parse(res[0]);
    return users.includes(userID);
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

function checkUserRegistered(userID) {
	var res = getResFromFile('pogPoints.txt');
	res = res.split('\n');
    var users = JSON.parse(res[0]);
   	if (users.includes(userID)) {
   		return true;
   	} else {
   		return false;
   	}
}

function registerUser(userID) {
	var res = getResFromFile('pogPoints.txt');
	res = res.split('\n');
    
    var users = JSON.parse(res[0]);
    users.push(userID);
    res[0] = JSON.stringify(users);
    
    var userBalances = JSON.parse(res[1]);
    userBalances[userID] = 100;
    res[1] = JSON.stringify(userBalances);

    var serverTotal = parseInt(res[2]);
    serverTotal += 100;
    res[2] = serverTotal.toString();

    clearFile('pogPoints.txt');
    addToFile('pogPoints.txt', res.join('\n'));
    return true;
}

function getUserBalance(userID) {
	var res = getResFromFile('pogPoints.txt');
	res = res.split('\n');
	var userBalances = JSON.parse(res[1]);
	return userBalances[userID]
}

function getAllBalances() {
	var res = getResFromFile('pogPoints.txt');
	res = res.split('\n');
	var userBalances = JSON.parse(res[1]);
	return userBalances
}

function checkValidBettingAmt(bettingAmt, userID) {
	var userBal = getUserBalance(userID);
	if (userBal >= bettingAmt) {
		return true;
	} else {
		return false;
	}
}

function getMultiBet() {
	var res = getResFromFile('multiRolls.txt');
    res = res.split('\n');
    var bet = JSON.parse(res[1]);
    return bet;
}

function payUser(userID, amt) {
	var res = getResFromFile('pogPoints.txt');
	res = res.split('\n');
    
    var userBalances = JSON.parse(res[1]);
    var currBalance = parseFloat(userBalances[userID]);
    var newBalance = currBalance + amt;
    userBalances[userID] = newBalance;
    res[1] = JSON.stringify(userBalances);

    clearFile('pogPoints.txt');
    addToFile('pogPoints.txt', res.join('\n'));
    return true;
}

function takeFromUser(userID, amt) {
	var res = getResFromFile('pogPoints.txt');
	res = res.split('\n');
    
    var userBalances = JSON.parse(res[1]);
    var currBalance = parseFloat(userBalances[userID]);
    var newBalance = currBalance - amt;
    userBalances[userID] = newBalance;
    res[1] = JSON.stringify(userBalances);

    clearFile('pogPoints.txt');
    addToFile('pogPoints.txt', res.join('\n'));
    return true;
}

function distFunds(winner, losers, bet) {
	var amtWon = bet * losers.length;
	var res = getResFromFile('pogPoints.txt');
	res = res.split('\n');
	var userBalances = JSON.parse(res[1]);
	var currBalance = userBalances[winner];
	currBalance += amtWon;
	userBalances[winner] = currBalance;

    for (i = 0; i < losers.length; i++) {	
	    currBalance = userBalances[losers[i]];
	    currBalance -= bet;
	    userBalances[losers[i]] = currBalance;
	}
	res[1] = JSON.stringify(userBalances);
		
	clearFile('pogPoints.txt');
    addToFile('pogPoints.txt', res.join('\n'));
    return true;
}


function getWinMsg() {

    var poss = ["AND THE STUPID FUCKING WINNER IS ", "POG, YOU WIN ", "UwU YOU WON ", "Pogggggers ", "PWNG BITCHES. The winner is "];
    return poss[Math.floor(Math.random() * poss.length)];

}

function getLossMsg() {

    var poss = ["The rest of you are malding manlets", "Fuck everyone else", "Everyone else is dumb as hell", "Everyone else: No pog, no pawg."];
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

function isNumber(str) {
  if (typeof str != "string") return false // we only process strings!
  // could also coerce to string: str = ""+str
  return !isNaN(str) && !isNaN(parseFloat(str)) && (parseFloat(str) >= 0)
}
function chooseAudioEncoder(list) {
	return 'ffmpeg';
}

function deleteMessage(channel, message, time_ms) {
	bot.deleteMessage({
		channelID: channel,
		messageID: message
	});
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
        var args = message.substring(1).trim().split(' ');
        console.log(args);
        var cmd = args[0];
        if (cmd == 'multi' && args.length > 1) {
        	var possBet = args[1];
        	if (isNumber(possBet)) {
        		var bettingAmt = parseFloat(possBet);
        	} else {
        		bot.sendMessage({
                        to: channelID,
                        message: '\'' + possBet.toString() + '\'' + ' is not a valid betting amount. Try to bet again!'
                });
                return;
        	}
   		} else if (cmd == 'multi' && args.length == 1) {
   			var bettingAmt = 0;
   		}

        args = args.splice(1);
        switch(cmd) {
            // !ping
            case 'roll':
            	deleteMessage(channelID, message.messageID, 2000);
                var rand = Math.floor(Math.random() * 101);
                bot.sendMessage({
                    to: channelID,
                    message: user + '\'s roll ->  ' + rand.toString()
                });
                break;
            case 'multi':
            	deleteMessage(channelID, message.messageID, 2000);
                if (checkMulti()) {
                    bot.sendMessage({
                        to: channelID,
                        message: 'A Roll is already running! Join the roll with \'$join\''
                    });

                } else {
            //     	var VCID = '313912537684901891';
            //     	var startAudio = getStartAudio();
            //     	var winAudio = getWinAudio();
            //     	bot.joinVoiceChannel(VCID, (err) => {
            //     		if(err) return console.log(err);

            //     		bot.getAudioContext(VCID, (err, stream) => {
				        //     if (err) return console.log(err);
				        //     playing = fs.createReadStream(startAudio);
				        //     playing.pipe(stream, {end: false});
				        // });
            //     	});
 					if (checkValidBettingAmt(parseFloat(bettingAmt), userID)) {
 						if (bettingAmt == 0) {
 							var msg = 'Roll ends in 15 seconds, lock in your spot! -> type \'$join\'\nCURRENT BET: NO BET';
 						} else {
 							var msg = 'Roll ends in 15 seconds, lock in your spot! -> type \'$join\'\nCURRENT BET: ₽' + bettingAmt + 'PP';
 						}
	                    bot.sendMessage({
	                        to: channelID,
	                        message: msg
	                    });
	                    
	                    addToFile('multiRolls.txt', JSON.stringify([]) + '\n' + bettingAmt.toString());
	                    setTimeout(function() {

	                        var result = playMulti(); 
	                        
	                        result = result.split('\n');
	                        
	                        result.shift();
	                        result.shift();

	                        var rolls = [];
	                        var msg = '';

	                        for (i = 0; i < result.length; i++) {
	                            var curr = JSON.parse(result[i]);
	                            rolls.push(curr);
	                        }
	                        var winner = getWinner(rolls);
	                        var tieBreakerNeeded = false;
	                        var tied = [];
	                        if (winner.length > 1) {
	                    
	                        	tieBreakerNeeded = true;
	                        	for (i = 0; i < winner.length; i++) {
	                        		tied.push(winner[i].user);
	                        	}
	                        }

	                        if (tieBreakerNeeded) {

	                        	while (tieBreakerNeeded) {
	                        		var tiedRoll = winner[0].roll;
	                        		for (i = 0; i < rolls.length; i++) {
	                        			if (rolls[i].roll == tiedRoll) {
	                        				var currRoll = Math.floor(Math.random() * 101);
	                        				rolls[i].roll = currRoll;
	                        			}
	                        		}
	                        		winner = getWinner(rolls);
	                        		if (winner.length == 1) {
	                        			
	                        			tieBreakerNeeded = false;
	                        		}
	                        	}
	                        } 
                            if (result.length > 1) {
                           		
                           		var finalWinner = winner[0].user;
                           		for (i = 0; i < rolls.length; i++) {
                           			var curr = rolls[i];

                           			msg += (curr.roll + ' <- ' + bot.users[curr.user].username + '\'s roll' + "\n");
                           		}
								msg += (getWinMsg() + bot.users[finalWinner].username + '! Enjoy your ₽' + bettingAmt.toString() + 'PP\n' + getLossMsg());
                        		var losers = [];
                        		for (i = 0; i < result.length; i++) {
                            		var curr = JSON.parse(result[i]);
                            		var currUser = curr.user;
                            		if (currUser != finalWinner) {
                            			losers.push(currUser);
                            		}
                        		}
                        		distFunds(finalWinner, losers, bettingAmt);
							} else {
								if (result.length == 1) {
									msg += (getWinMsg() + bot.users[winner[0].user].username + '! You don\'t win anything lonely loser.');
								} else {
									msg += ('Nobody joined the roll. Try again using \'$multi\', then \'$join\'');
								}
							}
	                        

	                        // playMultiSound("win");
	                        bot.sendMessage({
	                            to: channelID,
	                            message: msg
	                        });

	                    }, 15000);
	                } else {
	                	var msg = user + ', you do not have enough Pog Points to bet that amount (₽' + bettingAmt.toString() + 'PP). Check your balance using \'$bank\'';
	                	bot.sendMessage({
	                        to: channelID,
	                        message: msg
	                    });
	                }
	            }
                break;
            case 'join':
            	deleteMessage(channelID, message.messageID, 2000);
                if (checkMulti()) {
                    if (!isAlreadyInMulti(userID)) {
                    	var bettingAmt = getMultiBet();
                    	if (checkValidBettingAmt(bettingAmt, userID)) {
	                        var rand = Math.floor(Math.random() * 101);
	                        var dict = {"user": userID, "roll": rand.toString()};
	                        var msg = '\n' + JSON.stringify(dict);
	                        addUserToMulti(userID);
	                        addToFile('multiRolls.txt', msg);
	                    } else {
	                    	bot.sendMessage({
                        	to: channelID,
                        	message: user + ', you do not have enough Pog Points to bet that amount (₽' + bettingAmt.toString() + 'PP). Check your balance using \'$bank\''
                    		});
	                    }
                    }
                } else {
                    bot.sendMessage({
                        to: channelID,
                        message: 'No party roll is currently running :,(  -> initiate with \'$multi\''
                    });
                }
                break;
            case 'register':
            	deleteMessage(channelID, message.messageID, 2000);
            	if (checkUserRegistered(userID)) {
            		bot.sendMessage({
            			to: channelID,
            			message: user + ', you are already registered! -> Use command \'$bank\' to check your current Pog Point balance.'
            		});
            	} else {
            		if (registerUser(userID)) {
            			var msg = user + ', your pog account has been successfully created at PoggyBank. Check your account balance using \'$bank\'';
            		} else {
            			var msg = user + ', error in your PoggyBank account registration. Try again using \'$register\'';
            		}
            		bot.sendMessage({
            			to: channelID,
            			message: msg
            		});
            	}
            	break;
            case 'bank':
            	deleteMessage(channelID, message.messageID, 2000);
            	if (checkUserRegistered(userID)) {
            		var balance = getUserBalance(userID);
            		var msg = user + '\'s balance: 	₽' + balance.toString() + 'PP';
            	} else {
            		var msg = user + ', you do not have account at PoggyBank. Register for an account using \'$register\'';
            	}
            	bot.sendMessage({
            		to: channelID,
            		message: msg
            	});
            	break;
            case 'bank-all':
            	deleteMessage(channelID, message.messageID, 2000);
            	var balances = getAllBalances();
            	var msg = 'PoggyBank balances:\n-------------------\n';
            	var userIDs= Object.keys(balances);

            	for (i=0; i < userIDs.length; i++) {
            		var curr = userIDs[i];
            		var userName = bot.users[curr].username;
            		var balance = balances[curr];
            		msg += (userName + '\'s balance: 	₽' + balance.toString() + 'PP\n');
            	}
            	msg += '-------------------\nCURRENT EXCHANGE RATE: ₽10 / $1';
            	bot.sendMessage({  
            		to: channelID,
            		message: msg
            	});
            	break;
            case 'help':
            	
                var msg = 'Gambler commands:\n\n\'$roll\' - Use to roll a random number between 0 and 100.\n\'$multi\' - Use to start a party roll, allows 15 seconds for any members to lock in their roll.\n\'$multi xx\' - Similar to \'$multi\', but enter amount to bet as xx. All Users who enter the roll will bet that amount. Winner will receive total betting pool, loser(s) will lose amount of bet.\n\'$join\' - Used to lock in a roll during the 15 second party roll lock-in phase.\n\'$register\' - Used to register an account at PoggyBank.\n\'$bank\' - Used to display your PoggyBank account balance.\n\'$bank-all\' - Used to display the PoggyBank balance of all registered users.\n\'$help\' - You\'re looking at it! Lists gambler commands and their uses.';
                bot.sendMessage({
                    to: channelID,
                    message: msg
                });
                break;
         }
     }
});