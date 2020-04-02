var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var fs = require('fs');


function checkMulti() {
    res = getResFromFile('multiRolls.txt');
    console.log(res.length);
    console.log(res);
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
	res = JSON.parse(res);
    var users = res.users;
   	if (users.includes(userID)) {
   		return true;
   	} else {
   		return false;
   	}
}

function registerUser(userID) {
	var res = getResFromFile('pogPoints.txt');
	res = JSON.parse(res);
    
    var usersList = res.users;
    usersList.push(userID);
    res.users = JSON.stringify(usersList);
    
    var userBalances = res.balance;
    userBalances[userID] = 100;
    res.balance = JSON.stringify(userBalances);

    var serverTotal = res.total;
    serverTotal += 100;
    res.total = serverTotal;

    clearFile('pogPoints.txt');
    addToFile('pogPoints.txt', JSON.stringify(res));
    return true;
}

function getUserBalance(userID) {
	var res = getResFromFile('pogPoints.txt');
	res = JSON.parse(res);
	var userBalances = res.balance;
	console.log(userBalances);
	console.log(userBalances[userID]);
	return userBalances[userID];
}

function getAllBalances() {
	var res = getResFromFile('pogPoints.txt');
	res = JSON.parse(res);
	return res.balance;
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
	res = JSON.parse(res);
    
    var userBalances = res.balance;
    var currBalance = userBalances[userID];
    currBalance += amt;
    userBalances[userID] = currBalance;
    res.balance = JSON.stringify(userBalances);

    clearFile('pogPoints.txt');
    addToFile('pogPoints.txt', JSON.stringify(res));
    return true;
}

function takeFromUser(userID, amt) {
	var res = getResFromFile('pogPoints.txt');
	res = JSON.parse(res);
    
    var userBalances = res.balance;
    var currBalance = userBalances[userID];
    currBalance -= amt;
    userBalances[userID] = currBalance;
    res.balance = JSON.stringify(userBalances);

    clearFile('pogPoints.txt');
    addToFile('pogPoints.txt', JSON.stringify(res));
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
  return !isNaN(str) && !isNaN(parseFloat(str))
}


// function playMultiSound(flag) {
	
// 	if (flag == "start") {
// 		const dispatcher = connection
// 			.play("./" + getStartAudio()).on("error", error => console.error(error));
// 	} else {
// 		const dispatcher = connection
// 			.play("./" + getStartAudio()).on("finish", () => {
// 				channel.leave();
// 			}).on("error", error => console.error(error));
// 	}
// }

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
                        message: 'Roll already initiated! Join the roll with \'$join\''
                    });
                } else {
                	
                	//const channel = user.voiceChannel;
					// if(!channel) {
					// 	return console.log("not in vc");
					// }

					// try {
					// 	var connection = channel.join();
					// } catch (err) {
					// 	return console.log(err);
					// }
                 	//playMultiSound("start");

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
	                        console.log(result.length);

	                        var rolls = [];
	                        var msg = '';

	                        for (i = 0; i < result.length; i++) {
	                            var curr = JSON.parse(result[i]);
	                            rolls.push(curr);
	                            console.log('curr.user:      ' + curr.user);
	                            msg += (curr.roll + ' <- ' + bot.users[curr.user].username + '\'s roll' + "\n");
	                        }

	                        var winner = getWinner(rolls);
	                        if (winner.length > 1) {
	                            var tied = bot.users[winner[0].user].username;
	                            for (i = 1; i < winner.length; i++) {
	                                tied += (' & ' + bot.users[winner[i].user].username);
	                            }
	                            msg += 'THERE HAS BEEN A FUCKING TIE :/\nThe not so special wInnErS are ' + tied + '.';
	                            msg += '\n\nPlay a tie breaker using the command \'$roll\' !';
	                        
	                        } else {
	                           
	                            msg += (getWinMsg() + bot.users[winner[0].user].username + '! Enjoy your ₽' + bettingAmt.toString() + 'PP\n' + getLossMsg());

	                        }

	                        // playMultiSound("win");
	                        bot.sendMessage({
	                            to: channelID,
	                            message: msg
	                        });

	                        var winner = winner[0].user;
	                        var amtWon = bettingAmt * (result.length);
	                        
	                        for (i = 0; i < result.length; i++) {
	                            var curr = JSON.parse(result[i]); 
	                            var currUser = curr.user;
	                            takeFromUser(currUser, bettingAmt);   
	                        }
	                        payUser(winner, amtWon);
	                        

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
                        message: 'No party roll currently running :,(  -> initiate with \'$multi\''
                    });
                }
                break;
            case 'register':
            	if (checkUserRegistered(userID)) {
            		bot.sendMessage({
            			to: channelID,
            			message: user + ', you are already registered! -> Use command \'$bank\' to check your current Pog Point balance.'
            		});
            	} else {
            		if (registerUser(userID)) {
            			var msg = user + ', your pog account has been successfully created at PoggyBank. Check your account balance using \'$bank\'';
            		} else {
            			var msg = user + ', error in your PogyBank account registration. Try again using \'$register\'';
            		}
            		bot.sendMessage({
            			to: channelID,
            			message: msg
            		});
            	}
            	break;
            case 'bank':
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
            	var balances = getAllBalances();
            	var msg = 'PoggyBank balances:\n-------------------\n';
            	var userIDs= Object.keys(balances);

            	for (i=0; i < userIDs.length; i++) {
            		var curr = userIDs[i];
            		var userName = bot.users[curr].username;
            		var balance = balances[curr];
            		msg += (userName + '\'s balance: 	₽' + balance.toString() + 'PP\n');
            	}
            	msg += '\nCURRENT EXCHANGE RATE: ₽10 / $1';
            	bot.sendMessage({  
            		to: channelID,
            		message: msg
            	});
            	break;
            case 'help':
                var msg = 'Gambler commands:\n\n\'$roll\' - Use to roll a random number between 0 and 100.\n\'$multi\' - Use to start a party roll, allows 15 seconds for any members to lock in their roll.\n\'$join\' - Used to lock in a roll during the 15 second party roll lock-in phase.\n\'$register\' - Used to register an account at PoggyBank.\n\'$bank\' - Used to display your PoggyBank account balance.\n\'$bank-all\' - Used to display the PoggyBank balance of all registered users.\n\'$help\' - You\'re looking at it! Lists gambler commands and their uses.';
                bot.sendMessage({
                    to: channelID,
                    message: msg
                });
                break;
         }
     }
});