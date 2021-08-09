//####################### Dependencies #######################//
require('dotenv').config();

const Commons = require('./scripts/commons.js');
const Embeds  = require('./scripts/embeds.js');
const Users   = require('./scripts/users.js');
const Pets    = require('./scripts/pets.js');
const Shop    = require('./scripts/shop.js');
const DB      = require('./scripts/database.js');
const pg       = require('pg');

const Discord   = require('discord.js');

const { Client, RichEmbed,  MessageEmbed} = require('discord.js');
const client = new Discord.Client();



//######################## Constants #########################//

const GLD_UNIVERSITY  = '597729466709704715';
const ROLE_TIMEOUT    = '597756118084878336';
const ROLE_MODERATOR  = '598064242545131520';
const ROLE_VERIFIED   = '597759254165979146';
const CHNL_MODLOGS    = '659687834986479617';
const CHNL_MODMSGS    = '659834085065097256';
const CHNL_MEDIA      = '663119103393005579';
const CHNL_CONFESSION = '702990047997067324';
const CHNL_BOTSPAM    = '597927626958700545';
const CHNL_ANNOUNCE   = '597742410868719616';
const EMOTE_BANHAMMER = '659834999243145277'; 
const MSG_MEDIA       = '663129147836596264';
const SOREING         = '498948020918812677';



//####################### Global Vars ########################//

var flags      = [];	// {mid, cid, eid} flagged message, channel, embed ID

var exc_chnl   = [] ;
var gen_chnl   = [] ;
var med_chnl   = [] ;
var bot_chnl   = [] ;
var aca_chnl   = [] ;

var flagwords  = [];
var safewords  = []; 
var superwords = [];

var confessCD  =[];

var ready      = false;
var updateID   = null;
var lastUpdate = 0;
var updateTick = 0;


//######################## Functions #########################//

/* Message Clearing feature that works on a 1 token command, like .clear */
/* Takes a message object and tokens in lowercase and uppercase form     */
async function clear(msg, ltokens, utokens)
{	
	if(msg.guild===null || msg.guild===undefined)
		return;

	var prompt = true;		// Show Yes/No Prompt
	var help   = false;		// Show Help description
	var verb   = false;		// Show Verbose information
	var err    = false;		// Error flag
	
	var pinned = false;		// Pinned messages option
	var every  = false;		// Every person option
	var all    = false;		// All messages option
	var insen  = false;		// Case Insensitive option
	var from   = 0;			// Starting ID range option 
	var to     = 0;			// Ending ID range option
	var count  = 0;			// Maximum messages to parse through option
	var time   = 0;			// Maximum time of selectable messages in minutes from now
	var word   = "";		// Keyword to parse for selecting messages
	var people = [];		// List of users to delete messages from
	
	var oerr   = [];		// List of options that can't be interpreted
	var text   = "";		// Final message contents
	
	/* Finding the users to delete messages from*/
	var mentions = msg.mentions.members.array();
	for(var i=0; i<mentions.length; i++)
		people.push(mentions[i].id);
	
	try
	{
		for( var tokenIdx = 1; tokenIdx < ltokens.length; tokenIdx++)
		{
			/* Skip mentions */
			if(ltokens[tokenIdx].length>0 && ltokens[tokenIdx][0]=='<')
				continue;
			
			/* Macro for the complex nuke option */
			if(ltokens[tokenIdx] == "nuke")
			{
				pinned = true;
				every  = true;
				all    = true;
				prompt = false;
				help   = false;
				break;
			}

			/* Option analysis */
			for(var i=0, end=false; i < ltokens[tokenIdx].length && !end; i++)
			{
				switch(ltokens[tokenIdx][i])
				{
					case 'f': prompt = false; break;
					case 'h': help   = true; break;
					case '?': help   = true; break;
					case 'v': verb   = true; break;
					case 'p': pinned = true; break;
					case 'a': all    = true; break;
					case 'e': every  = true; break;
					case 'i': insen  = true; break;
					case 'c': count  = ltokens[++tokenIdx]; end=true; break;
					case 't': time   = ltokens[++tokenIdx]; end=true; break;
					case 'w': word   = utokens[++tokenIdx]; end=true; break;	
					case 'r': from   = ltokens[++tokenIdx]; to = ltokens[++tokenIdx]; end=true; break;	
					default: if(!oerr.includes(ltokens[tokenIdx][i])) oerr.push(ltokens[tokenIdx][i]);
				}
			}
		}
	}
	/* Add error if the parameters can't be interpreted */
	catch(e)
	{	text += "**ERROR** Failed to interpret the parameters for at least one option!\n";
		err=true;
	}
	
	/* Add error if the parameters are incorrect */
	if(!Number.isInteger(parseInt(count)) || !Number.isInteger(parseInt(from)) || !Number.isInteger(parseInt(to)) || !Number.isInteger(parseInt(time)))
	{	text += "**ERROR:** At least one of the numerical options entered are invalid!\n";
		err=true;
	}
	/* Add error if the user has missing permissions */
	if( (pinned || every || people.length>1 || (people.length >0 && !people.includes(msg.author.id)) ) && !msg.member.hasPermission('MANAGE_MESSAGES', false, true, true))
	{	text += "**ERROR:** Only moderators can delete others' messages and pinned messages!\n";
		err=true;
	}
	/* Add error if the user did not specify how to parse messages */
	if(!help && !all && count==0 && from==0 && to==0 && time==0)
	{	text += "**ERROR:** You need to set how to parse messages with `a`, `c`, `r` or `t` options!\n";
		err=true;
	}
	/* Add error if the user did not specify any users to select messages from */
	if(!help && !every && people.length==0)
	{	text += "**ERROR:** You need to set users with the `e` option or `@mentions`\n";
		err=true;
	}
	/* Add Warnning if the user specified a large time span as parameter */
	if(time > 180)
	{	text += "**WARNING:** Time criteria specifies more than 3 hours, is this intended?\n";
	}
	/* Add Warnning if the user specified a seemingly incorrect range parameter */
	if((from==0 && to !=0) || (from!=0 && to ==0))
	{	text += "**WARNING:** Range criteria contains a 0, is this intended?\n";
	}
	/* Add Warnning if the user used an everyone flag that overwrites other options */
	if(every && people.length > 0)
	{	text += "**WARNING:** Setting the `everyone` flag overwrites the user selection\n";
	}
	/* Add Warnning if the user used an all messages flag that overwrites other options */
	if(all && (count>0 || from>0 || to >0 || time>0 || word!=""))
	{	text += "**WARNING:** Setting the `all` flag overwrites count, range, time and keyword options\n";
	}
	/* Add Warnning if the user provided case insensitive search without a keyword */
	if(insen && word == "")
	{	text += "**WARNING:** Case insensitive search selected without a keyword\n";
	}
	/* List any options that failed to be interpreted */
	if(oerr.length!=0)
	{	text += "**WARNING:** The following options could not be interpreted: ";
		for(var i=0; i<oerr.length; i++)
			text += "`"+oerr[i]+"` ";
		text+="\n";
	}
	
	/* Add a verbose information based on the selection criteria */
	if(verb)
	{
		text += "\n```"
		
		text += count==0 ? "Count option is not used\n" : "Parsing at most "+ count + " messages\n";
		text += (from == 0 && to == 0) ? "Range option is not used\n" : ("Parsing messages between IDs\n    " + from +"\n    "+ to+"\n");
		text += time == "" ? "Time option is not used\n" : "Parsing messages from the past " + time + " minutes\n";
		text += word == "" ? "Keyword option is not used\n" : ("Parsing messages that contain \"" + word + "\" ("+(insen? "case insensitive": "case sensitive")+")\n");
		text += pinned ? "Including pinned messages\n" : "Not including pinned messages\n";
		text += every ? "Everyone flag is set\n" : "Everyone flag is not set\n";
		text += all ? "All messages flag is set\n" : "All messages flag is not set\n";
		text+= "Users selected for message deletion: ";
		for(var i = 0; i < mentions.length; i++)
		{	text+=mentions[i].user.username+" ";
		}		
		
		text+="```\n"
	}
	
	/* If help is selected or an error occured, send a Help Page (Errors included) */
	if(help || err)
	{
		text += "```.clear [ HELP PAGE ]``` A flexible and over complicated message clearing command with different customization options. ";
		text += "Users must be selected whose messages will be deleted. This is done by adding a mention. ";
		text += "Options can be written separated by space or together if they don't take parameters. \n\n";
		text += "`help, h or ? `  displays the help page for the command (automatic on errors)\n";
		text += "`c <count>    `  limit parsing to a maximum number of messages\n";
		text += "`t <minutes>  `  limit parsing to X minutes from now\n";
		text += "`w <keyword>  `  limit parsing to messages containing a keyword\n";
		text += "`r <from> <to>`  limit parsing to be between 2 messages by ID\n";
		text += "`p            `  include pinned messages in the deletion\n"
		text += "`i            `  case insensitive mode for parsing for a keyword\n"
		text += "`a            `  include all messages in the parsing\n"
		text += "`e            `  include every user in the message deletion\n"
		text += "`f            `  delete messages without a Y/N prompt\n"
		text += "`v            `  give verbose information on the selection criteria (mostly testing)\n";
		text += "`nuke         `  erase history without turning back.. should have used `ae` instead!\n";
		msg.channel.send(text);
		return;
	}
	
	/* If no errors are present and all required fields are filled out, get all messages to delete */
	var messages = await getMessages(msg, all ? -1 : count, word, from, to, time, pinned, insen, every ? -1 : people);
	
	/* If a prompt window is required before action, send one with reactions (Errors Included)     */
	/* Reactions are monitored till the requesting user presses Yes or No, or the prompt expires   */
	if(prompt)
	{
		text += "`"+messages.length + " messages met the criteria!`\n`Do you want to delete them?`\n" + msg.author.toString();
		
		var   yno = await msg.channel.send(text);
		await yno.react("🇾");
		await yno.react("🇳");
		
		const filter = (reaction, user) =>
		{	return ['🇾', '🇳'].includes(reaction.emoji.name) && user.id === msg.author.id;
		}
		
		yno.awaitReactions(filter, {max:1, time: 60000, errors:['time']})
			.then(collected =>
			{
				const reaction = collected.first();
				yno.reactions.removeAll();
				
				if(reaction.emoji.name == '🇾')
				{	deleteMessages(messages);
				}
			})
			.catch(collected=> { yno.reactions.removeAll(); })
	}
	/* If no prompt window is required to make an action action, start deleting immediately */
	else
	{
		msg.channel.send("`"+ messages.length + " messages met the criteria!`\n`Deleting messages without a prompt!`");
		deleteMessages(messages);
	}
	
}

async function getMessages(msg, count, word, from, to, time, pin, insen, users)
{
	var msgs  = [];								// Array of message objects fetched from Discord 
	var res   = [];								// Array of messages selected for deletion as a result
	var start = from < to ? to : from;			// Start ID of range search selection
	var end   = from < to ? from : to;			// End ID for range search selection
	var tlim  = new Date() - (time * 60000);	// Time of the oldest message for selection
	var run   = true;							// State of the query 
	var valid = true;							// Validity of a message for selection
	var proc  = start != 0 ? 1 : 0;				// Number of processed messages (not the same as selected)
	
	/* Setting the starting message of the query */
	/* If the start can not be defined, quit     */
	var lastMsg = start != 0 ? (await msg.channel.fetchMessage(start)) : msg;
	if(lastMsg === undefined)
			return -1;
	res.push(lastMsg);
	
	while(run)
	{
		/* Fetch 100 of the last messages (100 is API limitation) */
		/* If messages can't be fetched, quit                     */
		msgs = await msg.channel.messages.fetch({ limit: 100, before: lastMsg.id});
		if(msgs === undefined)
			return -1;
		msgs = msgs.array();
		
		for(var i = 0; i < msgs.length && run; i++)
		{
			valid = true;
			
			/* Check if the Count, Range and Time Exit Conditions are met       */
			/* When the exit conditions are met, no more messages are processed */
			if(count > 0 && proc > count)
				run = false;
			if(start != 0 && msgs[i].id < end)
				run = false;
			if(time > 0 && msgs[i].createdAt < tlim)
				run = false;
			
			if(run)
			{			
				/* If messages are still processed, check if the message should be selected    */
				/* Messages are selected basedon keywords, authors and pinned status (Options) */
				if( word != "" && (insen ? msgs[i].content.toLowerCase() : msgs[i].content).indexOf(word) == -1)
					valid = false;
				if( users != -1 && !users.includes(msgs[i].author.id))
					valid = false;
				if(msgs[i].pinned && !pin)	
					valid = false;
				
				proc++;
				if(valid)
					res.push(msgs[i]);
			}
		}
		
		
		/* Set the last mesage for starting a new query of 100 elements        */
		/* If the function fetches ALL messages but less than 100 gotten, quit */
		lastMsg = msgs.length != 0 ? msgs[msgs.length-1] : 0;
		if(count == -1 && msgs.length < 100)
			run = false;
	}
	
	return res;
}

async function deleteMessages(msgs)
{
	/* Log the deleted messages */
	var log    = "";
	for(var i=0; i<msgs.length; i++)
		log+=(Commons.timeStamp(msgs[i].createdAt) + " "+ msgs[i].author.username+"("+ msgs[i].id +")\n    "+msgs[i].content+ "\n\n");
	Commons.saveToFile("message-logs/"+Commons.timeStamp_file()+".txt", log);
	
	var split = false;	// Point of splitting bulk and old messages
	var older  = [];	// List of old messages deleted one by one
	
	var timeLimit = new Date() - 1123200000;

	/* Split messages that can be bulk deleted and those that can not */
	for(var i = 0; i < msgs.length && !split; i++)
	{	if(msgs[i].createdAt.getTime() < timeLimit)
		{	older  = msgs.splice(i, msgs.length-i)
			split = true;
		}
	}
	
	/* Bulk Delete current messages*/
	while(msgs.length>0)
	{	var del = msgs.splice(0,100);
		del[0].channel.bulkDelete(del, true);
	}
	
	
	/* Delete old messages */
	while(older.length>0)
	{	var del = older.splice(0,1);
		await del[0].delete();
	}
}



async function flagMessage(msg, type, cause)
{	
	var post;
	
	var modlogs = msg.guild.channels.cache.get(CHNL_MODLOGS);
	
	if		(type == 'a') post = await modlogs.send(Embeds.automaticFlag(msg, cause));
	else if	(type == 'm') post = await modlogs.send(Embeds.manualFlag(msg, cause));
	else return;
	
	flags.push({mid:msg.id, cid:msg.channel.id, eid:post.id});
	
	await post.react("✅");
	await post.react("❎");
	
	DB.pool()
		.query(	"INSERT INTO flagged_messages (eid, cid, mid) "+
				"VALUES ("+post.id+", "+msg.channel.id+", "+msg.id+")") 
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to insert message into flagged_messages");
			return;
		});
}

async function filterMessage(msg)
{
	if(msg.channel.guild === undefined || msg.author.bot)
		return;
	
	var lcstr = msg.content.toLowerCase();
	
	/* Match complex words before the safe word reduction */
	for(var i = 0; i < superwords.length; i++)
		if(lcstr.indexOf(superwords[i]) != -1)
		{	flagMessage(msg, 'a', superwords[i]);
			return;
		}
	
	/* Remove words that are potentially false flags */
	for(var i = 0; i < safewords.length; i++)
		lcstr = lcstr.split(safewords[i]).join('');


	/* Match the text against a list of flag words */
	for(var i = 0; i < flagwords.length; i++)
		if(lcstr.indexOf(flagwords[i]) != -1)
		{	flagMessage(msg, 'a', flagwords[i]);
			return;
		}
}

async function flagListener(react, cid, mid)
{
	if(react.count>1)
	{
		var gld  =  client.guilds.cache.get(GLD_UNIVERSITY); 
		var chnl =  gld.channels.cache.get(cid);
		var msg  = 	await chnl.messages.fetch(mid)
					.catch(e => console.error(e.stack));
		
		/* Delete Record from the database */
		DB.pool()
			.query(	"DELETE FROM flagged_messages "+
					"WHERE mid="+mid)
			.catch(err=>
			{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to delete message from flagged_messages");
			});
		
		/* Remove the reactions and delete the message if it's approved */
		react.message.reactions.removeAll();
		if (msg !== undefined && react.emoji.name == "✅")
			msg.delete();
	}
}

async function listFlags(chnl)
{
	/* Retreive flag, safe and priority flag words */
	var sflags = DB.pool()
		.query( "SELECT word " +
				"FROM flagged_words " +
				"WHERE category=2 " +
				"ORDER BY word")
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to collect priority flags from flagged_words");
			return;
		});
	
	
	
	var flags = DB.pool()
		.query( "SELECT word " +
				"FROM flagged_words " +
				"WHERE category=0 " +
				"ORDER BY word")
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to collect flags from flagged_words");
			return;
		});
	
	var safe = DB.pool()
		.query(	"SELECT word " +
				"FROM flagged_words " +
				"WHERE category=1 " +
				"ORDER BY word")
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to collect exceptions from flagged_words");
			return;
		});
				
	safe   = await Promise.resolve(safe);
	flags  = await Promise.resolve(flags);
	sflags = await Promise.resolve(sflags);
	
	/* Format the information and send it to the channel */
	msg = "**__Priority Flags__**\n```";
	if(sflags.rows.length==0) msg+="-- None --\n"
	for(var i=0; i<sflags.rows.length;i++)
		msg+=sflags.rows[i].word+", ";
	msg += "```\n**__Normal Flags__**\n```";
	if(flags.rows.length==0) msg+="-- None --\n"
	for(var i=0; i<flags.rows.length;i++)
		msg+=flags.rows[i].word+", ";
	msg += "```\n**__Safe Words__**\n```";
	if(safe.rows.length==0) msg+="-- None --\n"
	for(var i=0; i<safe.rows.length;i++)
		msg+=safe.rows[i].word+", ";
	msg+="```";
	
	chnl.send(msg);
}

async function addFlag(msg, tokens)
{
	tokens.splice(0,1);
	var phrase = tokens.join(' ');
	
	/* Check if the word is already in the Database */
	var exists = await DB.pool()
		.query( "SELECT word " +
				"FROM flagged_words " +
				"WHERE word='"+phrase+"'")
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to check if the word exists in flagged_words");
			return;
		});
	
	/* Check if the word is causing a clash with safe words*/
	var clash = await DB.pool()
		.query( "SELECT word " +
				"FROM flagged_words " +
				"WHERE category=1 AND '"+phrase+"' LIKE '%'||word||'%'")
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to check if the word causes clashes in flagged_words");
			return;
		});
	
	if(exists.rows.length>0)
		msg.channel.send("**"+phrase+"** Already exists in the list!");
	else
	{	/* If there is a clash, insert the word as a priority word*/
		if(clash.rows.length>0)
		{	await DB.pool()
				.query( "INSERT INTO flagged_words(word, category) "+
						"VALUES ('"+phrase+"', 2)")
				.catch(err=>
				{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
					"Failed to insert word as a priority flag in flagged_words");
					return;
				});
			
			
			msg.channel.send("**"+phrase+"** Added as a Priority Flag!");
		}
		/* If there is no clash, insert the word as a normal flag */
		else
		{	await DB.pool()
				.query( "INSERT INTO flagged_words(word, category) "+
						"VALUES ('"+phrase+"', 0)")
				.catch(err=>
				{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
					"Failed to insert word as a normal flag in flagged_words");
					return;
				});
			
			msg.channel.send("**"+phrase+"** Added as a Normal Flag!");
		}		
		
		/* Reload flagged or safe words for message moderation */
		await loadflaggedWords();
	}
}

async function delFlag(msg, tokens)
{
	tokens.splice(0,1);
	var phrase = tokens.join(' ');
	
	/* Check if the word is already in the Database */
	var exists = await DB.pool()
		.query( "SELECT word " +
				"FROM flagged_words " +
				"WHERE (category=0 OR category=2) AND word='"+phrase+"'")
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to check if the word exists in flagged_words");
			return;
		});
	
	/* If the word doesn't exist, print an error message, otherwise delete it from the Database */
	if(exists.rows.length==0)
		msg.channel.send("**"+phrase+"** is not in the list of Flagged Words!");
	else
	{	await DB.pool()
			.query( "DELETE FROM flagged_words "+
					"WHERE word='"+phrase+"'")
			.catch(err=>
			{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to delete flag from flagged_words");
				return;
			});
			
		msg.channel.send("**"+phrase+"** Removed from the list of Flagged Words!");
		
		/* Reload flagged or safe words for message moderation */
		await loadflaggedWords();
	}

}

async function addSafe(msg, tokens)
{
	tokens.splice(0,1);
	var phrase = tokens.join(' ');
	
	/* Check if the word is already in the Database */
	var exists = await DB.pool()
		.query( "SELECT word " +
				"FROM flagged_words " +
				"WHERE word='"+phrase+"'")
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to check if the word exists in flagged_words");
			return;
		});
	
	if(exists.rows.length>0)
		msg.channel.send("**"+phrase+"** Already exists in the list!");
	else
	{	/* Insert the word into the database as an exception */
		await DB.pool()
			.query( "INSERT INTO flagged_words(word, category) "+
					"VALUES ('"+phrase+"', 1)")
			.catch(err=>
			{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to insert word as an exception in flagged_words");
				return;
			});
		
		/* Elevate the priority of flagged words if they fully contain the safe word */
		await DB.pool()
			.query( "UPDATE flagged_words "+
					"SET category=2 "+
					"WHERE category=0 AND word LIKE '%"+phrase+"%'")
			.catch(err=>
			{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to update priority of words in flagged_words");
				return;
			});

		/* Reload flagged or safe words for message moderation */
		loadflaggedWords();

		await msg.channel.send("**"+phrase+"** Added as a Safe Word Exception!");
	}
}

async function delSafe(msg, tokens)
{
	tokens.splice(0,1);
	var phrase = tokens.join(' ');
	
	/* Check if the word is already in the Database */
	var exists = await DB.pool()
		.query( "SELECT word " +
				"FROM flagged_words " +
				"WHERE category=1 AND word='"+phrase+"'")
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to check if the word exists in flagged_words");
			return;
		});
	
	if(exists.rows.length==0)
		msg.channel.send("**"+phrase+"** is not in the list of Safe Word Exceptions!");
	else
	{
		/* Delete the word into from Database  */
		await DB.pool()
			.query( "DELETE FROM flagged_words "+
					"WHERE word='"+phrase+"'")
			.catch(err=>
			{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to delete exception from flagged_words");
				return;
			});
					
		
		/* Reduce the priority of flagged words if they fully contained the safe word */
		await DB.pool()
			.query( "UPDATE flagged_words "+
					"SET category=0 "+
					"WHERE category=2 AND word LIKE '%"+phrase+"%'")
			.catch(err=>
			{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to update priority of words in flagged_words");
				return;
			});

		/* Reload flagged or safe words for message moderation */
		await loadflaggedWords();

		msg.channel.send("**"+phrase+"** Removed from the list of Safe Word Exceptions!");
	}

}



async function mediaListener(react, user, state)
{
	var role;
	
	var gld = client.guilds.cache.get(GLD_UNIVERSITY);
	var member = gld.members.cache.find(mbr => mbr.id==user.id)
	
	switch(react.emoji.name) 
	{
		case "senko": role = gld.roles.cache.get('663341465170214912'); break;
		case "📖"   : role = gld.roles.cache.get('663342446188560385'); break;
		case "ping" : role = gld.roles.cache.get('663342449472569345'); break;
		case "game" : role = gld.roles.cache.get('663342451884556298'); break;
		case "okay" : role = gld.roles.cache.get('663342453750759424'); break;
		case "📺"   : role = gld.roles.cache.get('663342455017701376'); break;
		case "🎶"   : role = gld.roles.cache.get('663342456229855253'); break;
		case "🐶"   : role = gld.roles.cache.get('663342457953452039'); break;
		case "🍔"   : role = gld.roles.cache.get('718394365159931967'); break;
		case "🚗"   : role = gld.roles.cache.get('744173400532058154'); break;
		case "🎨"   : role = gld.roles.cache.get('744173405263364207'); break;
		default: return;
	} 
	
	if(state==1)
		member.roles.add(role)
	if(state==-1)
		member.roles.remove(role)
}

async function updateMedia(cid, mid, tokens)
{
	tokens.splice(0,1);
	reacts = tokens;
	
	/* Get the message */
	var gld  = client.guilds.cache.get(GLD_UNIVERSITY);
	var chnl = gld.channels.cache.get(cid);
	var msg  = await chnl.messages.fetch(mid);
	
	/* Edit the Message */
	newMsg = await msg.edit(Embeds.mediaChannels());
	
	/* Add reactions */
	for(var i=0; i<reacts.length; i++)
		await newMsg.react(reacts[i]);
}



async function wipeSubjectRoles()
{
	/* Get all members */
	var gld  = client.guilds.cache.get(GLD_UNIVERSITY);
	var mbrs = gld.members.cache.array();
	
	/* Get all subject roles to be deleted */
	var roles = await DB.pool()
		.query(	"SELECT rid "+
				"FROM roles "+
				"WHERE category=1")
		.then(res=> 
		{	return res.rows.map(e=> e.rid);
		})
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to get subject roles from roles");
			return;
		});
	
	var commands = [];
	for(var i=0; i<mbrs.length; i++)
	{
		var mrls = mbrs[i].roles.cache.array();
		var cmd = {id:mbrs[i].id, r:[]};
		
		for(var j=0; j<mrls.length; j++)
			if(roles.includes(mrls[j].id))
				cmd.r.push(mrls[j].id);
				
		commands.push(cmd);
	}
	
	for(var i=0; i<commands.length; i++)
		if(commands[i].r.length!=0)
			await gld.members.cache.get(commands[i].id).roles.remove(commands[i].r);

	await DB.pool()
		.query(	"DELETE FROM user_roles "+
				"WHERE rid IN (SELECT rid FROM roles WHERE roles.category=1)")
		.then(res=> 
		{	return res.rows.map(e=> e.rid);
		})
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to delete user_roles where role category was 1");
			return;
		});

	console.log("Finished!!");
}

async function moveGradProject()
{
	/* Get channels and roles in question */
	var gld  = client.guilds.cache.get(GLD_UNIVERSITY);
	var gpc1 = gld.channels.cache.find(chn => chn.name=="grad-project-1");
	var gpc2 = gld.channels.cache.find(chn => chn.name=="grad-project-2");
	var gpr1 = gld.roles.cache.find(chn => chn.name=="CSIT321-1");
	var gpr2 = gld.roles.cache.find(chn => chn.name=="CSIT321-2");
	
	/* Swap the name of the channels and roles in the database and on discord */
	DB.pool()
		.query(	"UPDATE channels "+
				"SET name='grad-project-2' "+
				"WHERE cid="+gpc1.id+";\n" +
				"UPDATE channels "+
				"SET name='grad-project-1' "+
				"WHERE cid="+gpc2.id+";\n" +
				"UPDATE roles "+
				"SET name='CSIT321-2' "+
				"WHERE rid="+gpr1.id+";\n" +
				"UPDATE roles "+
				"SET name='CSIT321-1' "+
				"WHERE rid="+gpr2.id+";\n")
	
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to swap grad-project channels and roles in the database");
			return;
		});	
		
	gpc1.setName("grad-project-2");
	gpc2.setName("grad-project-1");
	gpr1.setName("CSIT321-2");
	gpr2.setName("CSIT321-1");
	
	/* Remove roles from users */
	var finished = gpr2.members.array();
	for(var i=0; i<finished.length; i++)
		await finished[0].roles.remove(gpr2.id);
	
	DB.pool()
		.query(	"DELETE FROM user_roles "+
				"WHERE rid="+gpr2.id)
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to swap grad-project channels and roles in the database");
			return;
		});	
}

async function syncData()
{
	var gld  = client.guilds.cache.get(GLD_UNIVERSITY);
	var mbrs = gld.members.cache.array();
	var txt  = "";
	
	for(var i=0; i<mbrs.length; i++)
	{
		if(!mbrs[i].user.bot)
		{
			var tu = Users.totalXP.find(e=> e.uid==mbrs[i].id);
			var gu = Users.gainedXP.find(e=> e.uid==mbrs[i].id);
			var su = Users.seasonXP.find(e=> e.uid==mbrs[i].id);
			
			tu.username = Commons.esc(mbrs[i].user.username)
			gu.username = Commons.esc(mbrs[i].user.username)
			su.username = Commons.esc(mbrs[i].user.username)
			
			tu.nickname = (mbrs[i].nickname === null || mbrs[i].nickname === undefined) ? null : Commons.esc(mbrs[i].nickname);
			gu.nickname = (mbrs[i].nickname === null || mbrs[i].nickname === undefined) ? null : Commons.esc(mbrs[i].nickname);
			su.nickname = (mbrs[i].nickname === null || mbrs[i].nickname === undefined) ? null : Commons.esc(mbrs[i].nickname);
			
			txt += "UPDATE users " +
					"SET username='" + tu.username + "', nickname="+( (tu.nickname === null ) ? "null " : "'"+tu.nickname+"' ")+
					"WHERE uid="+mbrs[i].id+";\n";
		}
	}
	DB.pool()
		.query(txt)
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to sync Usernames and Nicknames in the database");
			return;
		});	
}


async function confession(msg, tokens)
{
	//if(msg.author.id!=SOREING) return;
	tokens.splice(0,1);
	
	var text = tokens.join(' ');
	if(text.indexOf('@everyone') != -1 || text.indexOf('@here') != -1 || text.indexOf('`') != -1)
	{	msg.channel.send("You can't send that, remove the mention or `!");
		return;
	}

	var tnow = (0+Date.now()) /1000;
	var uidx = confessCD.findIndex(usr => usr.id == msg.author.id);

	if(uidx == -1)
		confessCD.push({id:msg.author.id, time:tnow});
	else if(confessCD[uidx].time+3600 > tnow)
	{
		msg.channel.send("It's too soon, keep your confession to yourself!");
		return;
	}
	else
		confessCD[uidx].time = tnow;
	
	var gld  = client.guilds.cache.get(GLD_UNIVERSITY)
	var conf = gld.channels.cache.get(CHNL_CONFESSION);
	conf.send("```\n"+tokens.join(' ')+"\n```");
}

async function timeout(msg)
{
	var err     = false;	// Error flag
	var people  = [];		// List of users mentioned
	var members = [];		// List of guild members to timeout or release
	var gauthor = null;		// Author of the message from the guild
	var gmember = null;		// A member from the guild
	var text    = "";		// Final message contents
	
	if(msg.guild !== null)
	{
		/* Get the guild member author by the author's ID for reference */
		gauthor = msg.guild.members.cache.find(mbr => mbr.id== msg.author.id)
		
		/* Finding the users to timeout/release from mentions*/
		people = msg.mentions.members.array();
		
		for(var i=0; i<people.length; i++)
		{
			/* Get a guild member by the mentions' ID for reference */
			var gmember = msg.guild.members.cache.find(mbr => mbr.id== people[i].id)
			if(gmember !== null)
				members.push(gmember)
		}
		/* Add error if the mentions are missing */
		if( people.length == 0 )
		{	text += "**ERROR:** You need to mention at least one user to timeout or release!\n";
			err=true;
		}
		/* Add error if the user has missing permissions */
		if( !gauthor.roles.cache.has(ROLE_MODERATOR) )
		{	text += "**ERROR:** You need to be a moderator to timeout or release users!\n";
			err=true;
		}
	}
	/* Add error if the command is sent from outside a guild */
	else
	{	text += "**ERROR:** This command can only be used in a guild (server)!\n";
		err=true;
	}
	
	/* If no errors were found, tiemout/release users in the array */
	if(!err)
	{	for(var i=0; i<members.length; i++)
			if(members[i].roles.cache.has(ROLE_TIMEOUT))
				members[i].roles.remove(ROLE_TIMEOUT)
			else
				members[i].roles.add(ROLE_TIMEOUT)	
	}
	else
	{	msg.channel.send(text);
	}
}

async function verify( msg, tokens) 
{	
	/* Delete message for confidentiality */
	msg.delete();

	/* Safety return if the parameters are wrong or the wrong person uses the function */
	if(tokens.length < 4 || msg.author.id != SOREING)
		return;
	
	var gld    = client.guilds.cache.get(GLD_UNIVERSITY); 
	var role   = gld.roles.cache.get(ROLE_VERIFIED);
	var member = gld.members.cache.get(tokens[1]); 
	
	/* Safety return if the objects can't be retrieved */
	if(role === null || member === null)
		return;
	
	DB.pool()
		.query( "INSERT INTO verification (uid, email, name) " +
				"VALUES (" + tokens[1] + ", '" + tokens[2] + "', '" + Commons.esc(tokens.splice(3).join(" ")) + "')")
		.then( res => 
		{  
				member.roles.add(role);
				member.user.send(Embeds.welcome(member.user));
				
				var modlogs = gld.channels.cache.get(CHNL_MODLOGS);
				modlogs.send(member.toString() + "** is now verified!**");
				msg.channel.send("**Verification of " + member.toString() + " Successful!**");
		})
		.catch(err=>
		{	msg.channel.send("**Failed to verify " + member.toString() + "!**"); 
			Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to insert user into verification");
			return;
		});
}



//######################### Resources ########################//

async function loadflaggedMessages()
{
	var fmtemp = await DB.pool()
		.query( "SELECT * "+
				"FROM flagged_messages")
		.then(res=> { return res.rows; })
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to cache flagged messages");
		});
		
	var eids = fmtemp.map(e=> e.eid);
	var gld  = client.guilds.cache.get(GLD_UNIVERSITY);
	var chnl = gld.channels.cache.get(CHNL_MODLOGS);
	chnl.messages.fetch(eids);
		
	flags = fmtemp;
}

async function loadflaggedWords()
{
	var fwtemp = DB.pool()
		.query( "SELECT word "+
				"FROM flagged_words "+
				"WHERE category=0")
		.then(res=> {return res.rows.map(e => e.word)})
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to cache flag words");
		});
		
	var swtemp = DB.pool()
		.query( "SELECT word "+
				"FROM flagged_words "+
				"WHERE category=1")
		.then(res=> {return res.rows.map(e => e.word)})
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to cache exception words");
		});
		
	var pwtemp = DB.pool()
		.query( "SELECT word "+
				"FROM flagged_words "+
				"WHERE category=2")
		.then(res=> {return res.rows.map(e => e.word)})
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to cache priority flag words");
		});
		
	flagwords  = await Promise.resolve(fwtemp);
	safewords  = await Promise.resolve(swtemp);
	superwords = await Promise.resolve(pwtemp);
}

async function loadChannelSettings()
{
	exc_chnl = DB.pool()
		.query( "SELECT cid "+
				"FROM channels "+
				"WHERE category=0")
		.then(res=> {return res.rows.map(e => e.cid)})
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to cache exception channels");
		});
		
	gen_chnl = DB.pool()
		.query( "SELECT cid "+
				"FROM channels "+
				"WHERE category=1")
		.then(res=> {return res.rows.map(e => e.cid)})
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to cache general channels");
		});
		
	med_chnl = DB.pool()
		.query( "SELECT cid "+
				"FROM channels "+
				"WHERE category=2")
		.then(res=> {return res.rows.map(e => e.cid)})
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to cache media channels");
		});
		
	bot_chnl = DB.pool()
		.query( "SELECT cid "+
				"FROM channels "+
				"WHERE category=3")
		.then(res=> {return res.rows.map(e => e.cid)})
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to cache bot channels");
		});
		
	aca_chnl = DB.pool()
		.query( "SELECT cid "+
				"FROM channels "+
				"WHERE category=4")
		.then(res=> {return res.rows.map(e => e.cid)})
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to cache academic channels");
		});
		
	
	exc_chnl =  await Promise.resolve(exc_chnl);
	gen_chnl =  await Promise.resolve(gen_chnl);
	med_chnl =  await Promise.resolve(med_chnl);
	bot_chnl =  await Promise.resolve(bot_chnl);
	aca_chnl =  await Promise.resolve(aca_chnl);
}

async function loadUserDetails()
{
	var gained = [];
	
	/* Fetch the user data from the database */
	var gusers  = DB.pool()
		.query( "SELECT users.uid, users.username, users.nickname, general AS g, media AS m, bots As b, academic AS a " +
				"FROM user_xpg INNER JOIN users on users.uid=user_xpg.uid")
		.then(res=> {return res.rows;})
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to cache users' general XP");
		});
		
	var susers  = DB.pool()
		.query( "SELECT users.uid, users.username, users.nickname, g1, m1, a1, g2, m2, a2, g3, m3, a3 " +
				"FROM user_xps INNER JOIN users on users.uid=user_xps.uid")
		.then(res=> {return res.rows;})
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to cache users' seasonal XP");
		});
	
	var twork = DB.pool()
		.query( "SELECT uid, work " +
				"FROM user_profile")
		.then(res=> {return res.rows;})
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to cache users' work timer");
		});
	
	gusers = await Promise.resolve(gusers);
	susers = await Promise.resolve(susers);
	twork  = await Promise.resolve(twork);
	
	/* Construct an identical array to the user data but with 0 xp */
	for(var i=0; i< gusers.length; i++)
		gained.push({uid:gusers[i].uid, username:gusers[i].username, username:gusers[i].nickname, g:0, m:0, b:0, a:0});

	/* Save the data to the module variables */
	Users.totalXP   = gusers;
	Users.seasonXP  = susers;
	Users.gainedXP  = gained;
	Users.workTimer = twork;
}

async function loadResources()
{
	/* Load flagged or safe words for message moderation */
	await loadflaggedWords();

	/* Load channel settings for XP and Moderation */
	await loadChannelSettings();

	/* Load Users and their XP */
	await loadUserDetails();

	/* Load Flagged Messages */
	await loadflaggedMessages()
}

async function loadMediaListener()
{
	var gld  = client.guilds.cache.get(GLD_UNIVERSITY)
	var chnl = gld.channels.cache.get(CHNL_MEDIA);

	try{
		var msg  = await chnl.messages.fetch(MSG_MEDIA)
	}
	catch(err){
		console.log("ayy");
	}
	
	
	await gld.members.fetch();
	msg.reactions.cache.forEach(r => r.users.fetch());
}



async function task(msg)
{
	var dbu = await DB.pool().query("SELECT uid FROM users ORDER BY uid");
	var gld  = client.guilds.cache.get(GLD_UNIVERSITY)
	await gld.members.fetch();
	var usrs = gld.members.cache.array()
	
	for(var i=0; i<usrs.length; i++)
	{
		var idx = dbu.rows.findIndex(e=> e.uid == usrs[i].id);

		if(idx>=0 && !usrs[i].user.bot)
		{
			var newvalu =  "'" + Commons.esc(usrs[i].user.username) + "'";
			var newvaln = (usrs[i].nickname === null || usrs[i].nickname === undefined) ? "NULL" : "'" + Commons.esc(usrs[i].nickname) + "'";
			
			await DB.pool()
			.query(	"UPDATE users "+
					"SET nickname=" + newvaln + ", username=" + newvalu + " "+
					"WHERE uid=" + usrs[i].id)
		}
		
	}
	
}

async function givegem(id, amt)
{
	DB.pool().query("UPDATE user_profile SET gems=gems+"+amt+" WHERE uid="+id);
}

//########################## Events ##########################//

async function onReady()
{
	await loadResources();
	await loadMediaListener();

	lastUpdate=Date.now() + 0;
	updateID = setInterval(onUpdate, 60000);
	
	ready = true;
	console.log("\x1b[33m" + Commons.timeStamp() + " MochiBot Started!\x1b[0m");
}

async function onMessage(msg)
{
	//if(msg.author.id!=SOREING) return;
	if(!ready) return;
	
	var ltokens = msg.content.toLowerCase().split(" ");
	var utokens = msg.content.split(" ");
	
	/* DM commands */
	if(ltokens.length>0)
	{	switch(ltokens[0].toLowerCase())
		{	case ".confession": confession(msg, utokens); break;
		}
	}
	
	if(msg.guild === null || msg.guild.id != GLD_UNIVERSITY) return;
	
	if(msg.channel.id=='597729467154169877')
	{
		var chance=Math.random()*1000;
		if(chance==0)
			msg.channel.send("( ͡° ͜ʖ ͡°)");
	}
	
	/* Update stopping safety warning*/
	var now = Date.now();
	if(Date.now() - lastUpdate > 120000)
	{	var gld  = client.guilds.cache.get(GLD_UNIVERSITY);
		var chnl = gld.channels.cache.get(CHNL_MODLOGS)
		chnl.send("I seem to have stopped updating the database! \n Something went wrong, call <@498948020918812677>!");
		
		lastUpdate=Date.now() + 0;
		updateID = setInterval(onUpdate, 60000);
	}
	
	/* Nitro Announcement */
	if(msg.type == "USER_PREMIUM_GUILD_SUBSCRIPTION")
	{	var chnl = msg.guild.channels.cache.get(CHNL_ANNOUNCE);
		chnl.send("<:nitro_img:743039483838070850> **Wow!** <:PogU:597939218442092564> " + msg.author.toString() + " **Just Boosted The Server! <:PagChomp:597946121914155028>**")
	}
	
	/* XP awarding function */
	if(!msg.author.bot)
	{	if(gen_chnl.includes(msg.channel.id)) Users.calculateXP(msg, 'g');
		if(med_chnl.includes(msg.channel.id)) Users.calculateXP(msg, 'm');
		if(bot_chnl.includes(msg.channel.id)) Users.calculateXP(msg, 'b');
		if(aca_chnl.includes(msg.channel.id)) Users.calculateXP(msg, 'a');
	}
	
	/* Message Moderation Teaking Commands */
	if(!exc_chnl.includes(msg.channel.id))
			filterMessage(msg);
	

	/* Moderation Commands */
	if(ltokens.length>0 && msg.member !== null && msg.member.roles.cache.has(ROLE_MODERATOR))
	{	switch(ltokens[0])
		{	case ".flaglist" : listFlags(msg.channel); return;
			case ".addflag"  : addFlag(msg, ltokens);  return;
			case ".delflag"  : delFlag(msg, ltokens);  return;
			case ".addsafe"  : addSafe(msg, ltokens);  return;
			case ".delsafe"  : delSafe(msg, ltokens);  return;	
			case ".timeout"  : timeout(msg);break;
		}
	}

	/* User Related and Profile Commands */
	if( Users.commands.includes(ltokens[0]) && msg.channel.id == CHNL_BOTSPAM)
	{	Users.commandManager(msg, ltokens, utokens);
		return;
	}
	
	/* Pets related Commands */
	if( Pets.commands.includes(ltokens[0]) && msg.channel.id == CHNL_BOTSPAM)
	{	Pets.commandManager(msg, ltokens, utokens);
		return;
	}
	
	/* Shop related Commands */
	if( Shop.commands.includes(ltokens[0]) && msg.channel.id == CHNL_BOTSPAM)
	{	Shop.commandManager(msg, ltokens, utokens);
		return;
	}

	/* Generic Commands */
	if(ltokens.length>0)
	{	switch(ltokens[0].toLowerCase())
		{	case ".clear"     : clear(msg, ltokens, utokens); break;
			case ".profile"   : 
			case ".rank"      : 
			case ".allrank"   : Users.commandManager(msg, ltokens, utokens); break;
			case ".petrank"   : Pets.commandManager(msg, ltokens, utokens);  break;
		}
	}
	
	/* Exclusive Commands */
	if(msg.author.id == SOREING)
	{
		switch(ltokens[0].toLowerCase())
		{
			case ".task"    : task(msg); break;
			case ".verify"  : verify(msg, utokens); break;
			case ".wipe"    : wipeSubjectRoles(); break;
			case ".proj"    : moveGradProject(); break;
			case ".sync"    : syncData(); break;
			case ".givegem" : givegem(msg.mentions.members.array()[0].id, ltokens[2]); break;
			case ".media"   : updateMedia(CHNL_MEDIA, MSG_MEDIA, ltokens); break;
			case ".rules"   : msg.channel.send(Embeds.infRules()); break;
			case ".roles"   : msg.channel.send(Embeds.infRoles()); break;
			case ".channels": msg.channel.send(Embeds.infChannels()); break;
			case ".help"    : msg.channel.send(Embeds.infHelp()); break;
			case ".phelp"   : msg.channel.send(Embeds.infPets()); break;
			case ".ahelp"   : msg.channel.send(Embeds.infPetActions()); break;
		}
	}
}

async function onUpdate()
{
	if(Date.now() - lastUpdate < 59000)
	{	var gld  = client.guilds.cache.get(GLD_UNIVERSITY);
		var chnl = gld.channels.cache.get(CHNL_MODLOGS)
		chnl.send("I seem to be updating multiple times a minute! \n Something went wrong, call <@498948020918812677>!");
		clearInterval(updateID);
	}
	
	var oldDate = new Date();
	oldDate.setTime(lastUpdate);
	lastUpdate = Date.now() + 0;
	updateTick++;
	
	var newDate = new Date();
	newDate.setTime(Date.now());

	if(oldDate.getDay() != newDate.getDay())
	{	await Users.shiftXP();
	}
	
	if(updateTick%3==0)
	{	Pets.increaseEnergy();
	}
	
	if(updateTick%5==0)
	{	Users.uploadXP();
		Users.setRanks(client);
	}
	
	if(updateTick%15==0)
	{	Pets.drainStats();
	}

}

function onMessageDelete(msg)
{
	if(!ready) return;
	if(msg.guild === null || msg.guild.id != GLD_UNIVERSITY) return;
		
	var idx = flags.findIndex(e=> e.mid == msg.id)
	if(idx >=0) 
	{	var chnl = msg.guild.channels.cache.get(CHNL_MODLOGS);
		var embd = chnl.messages.cache.get(flags[idx].eid);
		embd.reactions.removeAll();
	}
	
	var notExcl = !exc_chnl.includes(msg.channel.id);
	var notSpam = msg.channel.id != CHNL_BOTSPAM;
	var notBot  = !msg.author.bot;
	
	/* If all conditions met, Send the updated message as embed to #moderator-messages */
	if(notExcl && notSpam && notBot)
	{	var modmsgs = msg.guild.channels.cache.get(CHNL_MODMSGS);
		modmsgs.send(Embeds.msgDeleted(msg));
	}
}

function onMessageUpdate(oldmsg, newmsg)
{
	if(!ready) return;
	if(newmsg.guild === null || newmsg.guild.id != GLD_UNIVERSITY) return;
	
	var notExcl = !exc_chnl.includes(newmsg.channel.id);
	var notSpam = newmsg.channel.id != CHNL_BOTSPAM;
	var notBot  = !newmsg.author.bot;
	
	/* If all conditions met, Send the updated message as embed to #moderator-messages */
	if(notExcl && notSpam && notBot)
		if(oldmsg !== null && newmsg.content !== oldmsg.content)
		{	var modmsgs = newmsg.guild.channels.cache.get(CHNL_MODMSGS);
			modmsgs.send(Embeds.msgUpdated(oldmsg, newmsg)); 
		}
}

async function onMemberAdd(mbr)
{
	console.log("Membmer was added");
	if(!ready) return;
	if(mbr.guild.id != GLD_UNIVERSITY) return;
		
	var record = await DB.pool()
		.query(	"SELECT uid, nickname "+
				"FROM users "+
				"WHERE uid=" + mbr.id)
		.then(res => { return res.rows.length == 0 ? null : res.rows[0]; })
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to get the user's record from the database");
		});
	
	/* Insert new member into the database  */
	/* Send notification to #moderator-logs */
	if(record === null)
	{	DB.pool()
			.query(	"INSERT INTO users(uid, username) "+
					"VALUES ("+mbr.id+", '"+Commons.esc(mbr.user.username)+"');\n" + 
					"INSERT INTO user_profile(uid) "+
					"VALUES("+mbr.id+");\n"+
					"INSERT INTO pet_settings(uid) "+
					"VALUES("+mbr.id+");\n" +
					"INSERT INTO user_xpg(uid) "+
					"VALUES("+mbr.id+");\n" +
					"INSERT INTO user_xps(uid) "+
					"VALUES("+mbr.id+");\n" +
					"INSERT INTO user_habitats(uid, hid) "+
					"VALUES("+mbr.id+", 1);")
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to insert mandatory records into the database for "+mbr.user.username);
		});
		
		/* Push user into the local data tables */
		Users.totalXP.push({uid:mbr.id, username:mbr.user.username,  nickname:null, g:0, m:0, b:0, a:0});
		Users.gainedXP.push({uid:mbr.id, username:mbr.user.username, nickname:null, g:0, m:0, b:0, a:0});
		Users.seasonXP.push({uid:mbr.id, username:mbr.user.username, nickname:null, g1:0, m1:0, a1:0, g2:0, m2:0, a2:0, g3:0, m3:0, a3:0});
		
		var modlogs = mbr.guild.channels.cache.get(CHNL_MODLOGS);
		modlogs.send(Commons.timeStamp() + " <@" + mbr.user + "> Joined the server");
	}
	/* Request all the roles of the user and apply them with the nickname */
	/* Send notification to #moderator-logs */
	else
	{
		var roles = await DB.pool()
			.query( "SELECT roles.rid "+
					"FROM user_roles "+
					"INNER JOIN roles ON roles.rid=user_roles.rid "+
					"WHERE uid=" + record.uid+" AND roles.category<2")
			.then(res => { return res.rows; })
			.catch(err=>
			{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to get the roles from the database for " + mbr.user.username);
			});
		
		mbr.roles.add(roles.map(r => r.rid));
		
		if (record.nickname !== null)
			mbr.setNickname(record.nickname);
			
		var modlogs = mbr.guild.channels.cache.get(CHNL_MODLOGS);
		modlogs.send(Commons.timeStamp() + " <@" + mbr.id + "> Re-joined the server");
	}
}

function onUserUpdate(oldusr, newusr)
{
	if(!ready) return;
	if(newusr.bot) return;
	
	var gld  = client.guilds.cache.get(GLD_UNIVERSITY);
	var mbrs = gld.members.cache.array().map(e=> e.id);
	
	if(!mbrs.includes(newusr.id)) return;
	
	/* Change username in the Database      */
	/* Send notification to #moderator-logs */
	if(oldusr.username!=newusr.username)
	{
		var newval =  "'" + Commons.esc(newusr.username) + "'";
		var oldn   =  "'"+oldusr.username+"'"; 
		var newn   =  "'"+newusr.username+"'";
		
		var modlogs = gld.channels.cache.get(CHNL_MODLOGS);
		modlogs.send(Commons.timeStamp() + " <@" + newusr.id + "> Changed username from *" +  oldn + "* to *" + newn + "*" );
		
		Users.totalXP.find(e=> e.uid==newusr.id).username  = Commons.esc(newusr.username);
		Users.gainedXP.find(e=> e.uid==newusr.id).username = Commons.esc(newusr.username);
		Users.seasonXP.find(e=> e.uid==newusr.id).username = Commons.esc(newusr.username);
		
		DB.pool()
			.query(	"UPDATE users "+
					"SET username=" + newval + " "+
					"WHERE uid=" + newusr.id)
			.catch(err=>
			{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to update username in the database for " + newusr.username);
			});
	}	
}

function onMemberUpdate(oldmbr, newmbr)
{
	if(!ready) return;
	if(newmbr.guild.id != GLD_UNIVERSITY) return;
	if(newmbr.user.bot) return;
	
	/* Find the difference in roles between the new and old user */
	var oldroles = oldmbr.roles.cache.array();
	var newroles = newmbr.roles.cache.array();
	var add = newroles.filter(x => !oldroles.includes(x));
	var rem = oldroles.filter(x => !newroles.includes(x));
	
	/* Update user_roles in the Database */
	add.forEach(r => DB.pool()
		.query(	"INSERT INTO user_roles(uid, rid) "+
				"VALUES (" + newmbr.id + ", " + r.id + ")")
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to insert roles into the database database for " + newmbr.user.username);
		})
	)
	
	rem.forEach(r => DB.pool()
		.query(	"DELETE FROM user_roles "+
				"WHERE uid=" + newmbr.id + " AND rid=" + r.id)
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to delete roles from the database database for " + newmbr.user.username);
		})
	)
	
	/* Change nickname in the Database      */
	/* Send notification to #moderator-logs */
	if(oldmbr.nickname!=newmbr.nickname)
	{
		var newval = (newmbr.nickname === null || newmbr.nickname === undefined) ? "NULL" : "'" + Commons.esc(newmbr.nickname) + "'";
		var oldn   = (oldmbr.nickname === null || oldmbr.nickname === undefined) ? "'"+oldmbr.user.username+"'" : "'"+oldmbr.nickname+"'";
		var newn   = (newmbr.nickname === null || newmbr.nickname === undefined) ? "'"+newmbr.user.username+"'" : "'"+newmbr.nickname+"'";
		
		var modlogs = newmbr.guild.channels.cache.get(CHNL_MODLOGS);
		modlogs.send(Commons.timeStamp() + " <@" + newmbr.id + "> Changed nickname from *" +  oldn + "* to *" + newn + "*" );
		
		Users.totalXP.find(e=> e.uid==newmbr.id).nickname  = (newmbr.nickname === null || newmbr.nickname === undefined) ? null : Commons.esc(newmbr.nickname);
		Users.gainedXP.find(e=> e.uid==newmbr.id).nickname = (newmbr.nickname === null || newmbr.nickname === undefined) ? null : Commons.esc(newmbr.nickname);
		Users.seasonXP.find(e=> e.uid==newmbr.id).nickname = (newmbr.nickname === null || newmbr.nickname === undefined) ? null : Commons.esc(newmbr.nickname);
		
		DB.pool()
			.query(	"UPDATE users "+
					"SET nickname=" + newval + " "+
					"WHERE uid=" + newmbr.id)
			.catch(err=>
			{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to update nickname in the database for " + newmbr.user.username);
			});
	}	
}

function onMemberRemove(mbr)
{
	if(!ready) return;
	if(mbr.guild.id != GLD_UNIVERSITY) return;
	
	/* When a user leaves the server, send a notice in #moderator-logs */
	var modlogs = mbr.guild.channels.cache.get(CHNL_MODLOGS);
	modlogs.send(Commons.timeStamp() + " <@" + mbr.id +"> ("+mbr.user.username+"-"+mbr.id+") Left the server");
}

function onReactionAdd(react, usr)
{
	if(!ready) return;
	if(react.message.guild === null || react.message.guild.id != GLD_UNIVERSITY) return;
	
	/* Give XP for interaction */
	if(!usr.bot)
		Users.giveXP(react.message, 'm', 1);
	
	/* Media-Channel Role Manager to add roles */
	if(react.message.id == MSG_MEDIA)
		mediaListener(react, usr, 1);
	
	/* Message Flagging Manager for Manual Flagging */
	if(react.emoji.id == EMOTE_BANHAMMER)
		if(flags.findIndex(msg => msg.mid == react.message.id) == -1)
			flagMessage(react.message, 'm', usr);
	
	/* Manual Review of Flagged Messages */
	var flag_idx = flags.findIndex(msg => msg.eid == react.message.id) 
	if (flag_idx != -1)
		flagListener(react, flags[flag_idx].cid, flags[flag_idx].mid);
}

function onReactionRemove(react, usr)
{
	if(!ready) return;
	if(react.message.guild === null || react.message.guild.id != GLD_UNIVERSITY) return;
	
	/* Take XP Away for deletion */
	if(!usr.bot)
		Users.giveXP(react.message, 'm', -1);
	
	/* Media-Channel Role Manager to remove roles*/
	if(react.message.id == MSG_MEDIA)
		mediaListener(react, usr, -1);
}

function onError(e)
{	
	ready=false;
	client.destroy();
	
	console.log("\x1b[31m" + Commons.timeStamp() + " Connection Lost. Please wait - attempting to reestablish.\x1b[0m");
	reconnect(0,0);
};

function addEventListeners(client)
{
	client.on("ready",   onReady);
	client.on('message', onMessage);
	client.on('error',   onError);
	
	client.on('messageDelete',     onMessageDelete);
	client.on('messageUpdate',     onMessageUpdate);
	
	client.on('userUpdate',    	   onUserUpdate);
	client.on('guildMemberAdd',    onMemberAdd);
	client.on('guildMemberUpdate', onMemberUpdate);
	client.on('guildMemberRemove', onMemberRemove);	
	
	client.on('messageReactionAdd',		onReactionAdd);
	client.on('messageReactionRemove',	onReactionRemove);	
}



//########################## Connect ##########################//

async function connect(ctr, idx)
{	

	await client.login(process.env.BOT_TOKEN)
	.then( res => 
	{
	})
	.catch( err =>
	{	console.log("\x1b[31m" + Commons.timeStamp() + " Failed to connect. Retrying in 5 seconds!\x1b[0m"); 
		setTimeout(reconnect.bind(null, 0, 0), 5000);
	});
}

async function reconnect(ctr, idx)
{
	var recIntervals = [ 5000, 10000, 30000, 60000];
	
	await client.login(process.env.BOT_TOKEN)
	.then( res => 
	{	console.log("\x1b[32m" + Commons.timeStamp() + " Connection restored! Bot is ready to continue\x1b[0m");
		
	})
	.catch( err =>
	{	console.log("\x1b[31m" + Commons.timeStamp() + " Failed to reconnect. Retrying in "+(recIntervals[idx]/1000)+" seconds!\x1b[0m"); 
		setTimeout(reconnect.bind(null, ( ctr==9 ? 0 : ctr+1), (ctr==9 && idx < 3 ? idx+1 : idx)), recIntervals[idx]);
	});
}

// Connect
addEventListeners(client);
connect(0,0);


process.on("unhandledRejection", err => {
  if(!err) return console.error("Unknown promise error");
  console.error(err.stack);
});