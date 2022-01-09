const Commons = require('./commons.js');
const Embeds  = require('./embeds.js');
const DB      = require('./database.js');
const fs      = require('fs');

const { Client, RichEmbed,  MessageEmbed} = require('discord.js');
const { createCanvas, loadImage, Image } = require('canvas');

const EMOTE_COIN   = "<:coin_img:743056604844392479>";

const GLD_UNIVERSITY  = '597729466709704715';

/* Talkativity Variables */
var xpTotal = 0;
var talkativity = {};

const XPCurve = (talk) =>{
	//return -Math.exp(5.4 * talk - 5.7) + 1;
	return -Math.exp(2.5 * talk - 2.6) + 1.1;
}

/* Checks if the person leveled up */
function leveled(g, m, b, a, xp)
{
	var lv  = 0;
	var lim = 100;
	var rem = g/2 + m + b/4 + a;
	
	while(rem > lim)
	{	lv++;
		rem-=lim;
		lim*=1.1;
	}
	
	if(rem + xp > lim)
		return { res: true, lv:lv+2};
	return { res: false, lv:lv+1};
}

/* Constructs statistics for a profile */
function profileData(g, m, b, a)
{
	var lv  =0;
	var lim =100;
	var rem = g/2 + m + b/4 + a;
	var max = Math.max(g,m,b,a);
	
	while(rem > lim)
	{	lv++;
		rem-=lim;
		lim*=1.1;
	}
	
	return {level:lv+1, progress:rem/lim, g:g/max, m:m/max, b:b/max, a:a/max };
}

/* Constructs a Profile Card for the user or the mentioned user */
/* The card includes their image, name, title, levels and badges */
async function profile(msg)
{	
	const canvas = createCanvas(800, 400)
	const ctx = canvas.getContext('2d');
	
	/* Picking the target for the profile, either the user or the mentioned user */
	var mentions = msg.mentions.members.array();
	var user = mentions.length ==0 ? msg.author : mentions[0].user;
	
	var record = null;
	var title  = null;
	var badges = null;
	var images = null;
	var badgePromises = [];
	var imagePromises = [];
	
	/* Fetching the generic user data from the database */
	record = DB.pool()
		.query( "SELECT users.uid, namecolor, titlecolor, username, nickname, title, coins, gems, background, avatar "+
				"FROM user_profile INNER JOIN users ON users.uid=user_profile.uid "+
				"WHERE users.uid="+user.id)
		.then(res=> {return res.rows[0]})
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to get " + user.username + "'s profile record");
			return;
		});
	
	/* Fetching the badge records from the database */
	badges = DB.pool()
		.query( "SELECT name "+
				"FROM user_badges INNER JOIN badges ON badges.bid=user_badges.bid " +
				"WHERE uid="+user.id+" " +
				"ORDER BY weight DESC")
		.then(res=> {return res.rows.map(e => e.name)})
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to get " + user.username + "'s profile badges");
			return;
		});
	
	record = await Promise.resolve(record);
	badges = await Promise.resolve(badges);
	
	/* Requesting the title of the user */
	if(record.title !== null) 
	{	title = await DB.pool()
			.query( "SELECT name "+
					"FROM titles "+
					"WHERE tid="+record.title)
			.then(res=> {return res.rows[0].name})
			.catch(err=>
			{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to get " + user.username + "'s profile titles");
				return;
			});
	}
	
	/* Check if the user's avatar changed. If so, download and cache it */
	if(record.avatarURL!=user.displayAvatarURL)
	{
		const avatar = createCanvas(256, 256)
		const actx = avatar.getContext('2d');
		
		// Background image missing locally quickfix
		if(record.background !== null){
			if(!fs.existsSync('images/backgrounds/'+record.uid+'.png')){
				const bg_save = createCanvas(800, 400);
				const bctx = bg_save.getContext('2d');
				var bgtemp = await Commons.loadImage(record.background);
				bctx.drawImage(bgtemp, 0,0, 800, 400);
				await Commons.saveImage(bg_save.createPNGStream(), 'images/backgrounds/'+record.uid+'.png');
			}
		}
		// Background image missing locally quickfix
		
		var ava = await Commons.loadImage(user.displayAvatarURL());
		actx.drawImage(ava, 0,0, 256, 256);
		
		await Commons.saveImage(avatar.createPNGStream(), 'images/avatars/'+record.uid+'.png');
		
		await DB.pool()
			.query( "UPDATE user_profile "+
					"SET avatar='" + user.displayAvatarURL() + "' "+
					"WHERE uid="+user.id)
			.catch(err=>
			{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to update "+user.username+"'s avatar URL");
				return;
			});
	}
	
	/* Loading Profile and Badge Images */
	imagePromises.push(Commons.loadImage(record.background !== null ? ('images/backgrounds/'+record.uid+'.png') : 'images/default.png'));
	imagePromises.push(Commons.loadImage('images/template_profile.png'));
	imagePromises.push(Commons.loadImage('images/avatars/'+record.uid+'.png'));
	
	for(var i=0; i<badges.length; i++)
		badgePromises.push(Commons.loadImage(badges[i]));
	
	badges = await Promise.all(badgePromises);
	images = await Promise.all(imagePromises);
	
	/* Calculate user stats */
	var userXP = module.exports.totalXP.find(e => e.uid == record.uid);
	var stats  = profileData(userXP.g, userXP.m, userXP.b, userXP.a);
	
	/* Construct Background */
	ctx.drawImage(images[0], 0,0, 800, 400);
	ctx.drawImage(images[1], 0, 0);
	ctx.drawImage(images[2], 30, 20, 145, 145);	
	
	/* Add Name text */
	ctx.font      = 'bold 36px Tahoma';
	ctx.textAlign = 'left'; 
	ctx.fillStyle = Commons.colorHex(record.namecolor);
	ctx.fillText(record.nickname !== null ? record.nickname : record.username, 190, 110);
	
	/* Add Title text */
	if(record.title !== null)
	{	title = await Promise.resolve(title);
		ctx.font      = '20px Tahoma';
		ctx.textAlign = 'left' ; 
		ctx.fillStyle = Commons.colorHex(record.titlecolor);
		ctx.fillText(title, 190, 140);
	}
	
	/* Add Level text */
	ctx.font      = 'bold 72px Tahoma';
	ctx.fillStyle = 'white';
	ctx.textAlign = 'center';
	ctx.fillText(stats.level, 105, 320);
	
	/* Add Currency text */
	ctx.font      = '20px Tahoma';
	ctx.fillStyle = 'black';
	ctx.textAlign = 'right'; 
	ctx.fillText(record.coins, 730, 135);
	ctx.fillText(record.gems, 730, 175);
	
	/* Draw XP Progressbar */
	ctx.fillStyle = '#7289DA';
	ctx.fillRect(33, 347, 146*stats.progress, 26);
	
	/* Draw Statistics Graph columns */
	ctx.fillStyle = '#E27D60';
	ctx.fillRect(219, 339, 32, -3 -97*stats.g)
	ctx.fillStyle = '#85CDCA';
	ctx.fillRect(254, 339, 32, -3 -97*stats.m)
	ctx.fillStyle = '#E8C97C';
	ctx.fillRect(289, 339, 32, -3 -97*stats.b)
	ctx.fillStyle = '#C38D9D';
	ctx.fillRect(324, 339, 32, -3 -97*stats.a)
	
	/* Draw Badges */
	for(var i=0; i<badges.length; i++)
		ctx.drawImage(badges[i], 400+64*(i%6),192+(Math.floor((i/6))*64), 64, 64);
	
	/* Send the Image to the channel */
	var imgbuffer = await canvas.toBuffer();
	msg.channel.send( { files: [imgbuffer] });
}
	
/* Lists all the titles and indicates the ones available for the user */
async function listTitle(msg)
{
	/* Get the list of titles and the user's unlocked titles from the Database */
	var titles  = DB.pool()
		.query(	"SELECT * "+
				"FROM titles "+
				"ORDER BY tid")
		.then(res => { return res.rows; })
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed get the titles from the database");
		});

	var utitles = DB.pool()
		.query( "SELECT tid "+
				"FROM user_titles "+
				"WHERE uid=" + msg.author.id)
		.then(res => { return res.rows.map((t => t.tid)); })
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed get the user's titles from the database");
		});
	
	titles  = await Promise.resolve(titles);
	utitles = await Promise.resolve(utitles);
	
	
	/* Create and populate the*/
	var embed = new MessageEmbed();
	embed.setDescription("**__Title List__**");
	
	for(var i=0; i< titles.length; i+=2)
	{	
		var item1 = titles[i].tid + ") " + titles[i].name + (utitles.includes(titles[i].tid) ? "" : " [LOCKED]");
		var item2 = "\u200B";
		
		if( i+1 < titles.length)
			item2 = titles[i+1].tid + ') ' + titles[i+1].name + (utitles.includes(titles[i+1].tid) ? "" : " [LOCKED]");
		
		embed.addField(item1, item2, false)
	}
		
	msg.channel.send(embed);
}

/* Changes the title of a user on the Profile Card if it's unlocked */
async function setTitle(msg, title)
{
	/* Check if the user input for title ID exists */
		if(title === undefined)
		{	msg.channel.send("Invalid Title ID");
			return;
		}
		
		/* Get the list of unlocked titles of the user from the Database */
		var unlocked = await DB.pool()
			.query(	"SELECT tid "+
					"FROM user_titles "+
					"WHERE uid=" + msg.author.id + " and  tid=" + Commons.esc(title))
			.then(res => { return res.rows.length > 0 ? true : false })
			.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to check if the title is unlocked");
		});
		
		/* If the user has the title unlocked, assign it in the Database */
		if(unlocked)
		{	await DB.pool()
				.query(	"UPDATE user_profile "+
						"SET title="+Commons.esc(title)+" "+
						"WHERE uid=" + msg.author.id)
				.then(res=>
				{	msg.channel.send("New title set");	
				})
				.catch(err=>
				{	msg.channel.send("Operation Failed");
					Commons.errlog(new Error().stack+ Commons.pgerr(err), 
					"Failed to set the user's profile title");
				});
		}
		else
			msg.channel.send("You do not have this title unlocked");
}

/* Sends a message with the overall all time user rankings */
async function ranking(msg)
{
	var records  = module.exports.totalXP;
	var rankings = [];	
	
	/* Create a list of ranking records of names and XPs */
	for(var i=0; i<records.length; i++)
	{	var name = records[i].nickname !== null ? records[i].nickname : records[i].username;
		var xp   = records[i].g/2 + records[i].m + records[i].b/4 + records[i].a;
		rankings.push({name:name, score:xp, id:records[i].uid});
	}
	
	/* Sort the ranking records and send an embed with the data */
	rankings = rankings.sort(function (a,b) { return b.score - a.score;});
	msg.channel.send(Embeds.rankingOfUsers(rankings, msg.author));
}

/* Sends a message with the seasonal user rankings */
async function seasonalRanking(msg)
{
	var records  = module.exports.seasonXP;
	var rankings = [];	
	
	/* Create a list of ranking records of names and XPs */
	for(var i=0; i<records.length; i++)
	{	var name = records[i].nickname !== null ? records[i].nickname : records[i].username;
		var xp   = (records[i].g1/2 + records[i].m1 + records[i].a1) + (records[i].g2/2 + records[i].m2 + records[i].a2)/2 + (records[i].g3/2 + records[i].m3 + records[i].a3)/4;
		rankings.push({name:name, score:xp, id:records[i].uid});
	}
	
	/* Sort the ranking records and send an embed with the data */
	rankings = rankings.sort(function (a,b) { return b.score - a.score;});
	msg.channel.send(Embeds.rankingOfUsers(rankings, msg.author));
}

/* Gives the user money periodically */
async function work(msg, works)
{
	/* Find the user and the last time they worked */ 
	var idx = works.findIndex(usr => usr.uid == msg.author.id);
	var dif = Math.floor((parseInt(works[idx].work) + 900000 - Date.now()) /1000);
	
	/* Find the amount of minutes and seconds before they can work again */
	var m = Math.floor(dif%3600/60);
	var s = Math.floor(dif%60);
	
	/* If they can work, update the database and display a message */
	if(dif < 0)
	{
		DB.pool()
			.query( "UPDATE user_profile "+
					"SET work=" + (0 + Date.now()) + ", coins=coins+25 "+
					"WHERE uid=" + msg.author.id)
			.then(res=> 
			{
				works[idx].work = (Date.now() + 0)+"";
				msg.channel.send("**"+(msg.member.nickname !== null ? msg.member.nickname : msg.author.username) +"** gained **25"+EMOTE_COIN+"**!");
			})
			.catch(err=>
			{	msg.channel.send("Operation Failed");
				Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to update the user's work timer and money");
			});

	}
	else
		msg.channel.send("**"+ (msg.member.nickname !== null ? msg.member.nickname : msg.author.username) +"**, you can only work once every **15 minutes**!\n Please try again in **" + (m < 10 ? '0' + m : m) + ":" + (s < 10 ? '0' + s : s) + "**" );
}

module.exports = {

	totalXP:   [],
	gainedXP:  [],
	seasonXP:  [],
	
	workTimer: [],

	commands: [".profile", ".listtitle", ".settitle", ".allrank", ".rank", ".work"],

	commandManager: function(msg, ltokens, utokens)
	{
		switch(ltokens[0])
		{
			case ".profile"  : profile(msg); break;
			case ".listtitle": listTitle(msg); break;
			case ".settitle" : setTitle(msg, ltokens[1]); break;
			case ".allrank"  : ranking(msg); break;
			case ".rank"     : seasonalRanking(msg); break;
			case ".work"     : work(msg, module.exports.workTimer); break;
		}
	},

	/* Calculate the percentages of how talkative everyone has been */
	/* Gets called everytime a new msg is detected just like calculateXP */
	calculateTalk: function()
	{	
		var records = module.exports.seasonXP;
		var userXPs = {};
		var _talkativity = {};
		
		xpTotal = 0;

		/* Gets total sum of all XPs */
		for(var i=0; i < records.length; i++)
		{
			xp = (records[i].g1/2 + records[i].m1 + records[i].a1);
			userXPs[records[i].uid] = xp;
			xpTotal += xp;
		}

		/* Divides each user percentage by total XP to get user talkativity percentage */
		// Division by zero failsafe. Could happen if no user has spoken that day maybe
		if(xpTotal == 0){
			for(var i=0; i < records.length; i++)
			{
				_talkativity[records[i].uid] = 0;
			}
			return;
		}

		for(var i=0; i < records.length; i++)
		{
			_talkativity[records[i].uid] = userXPs[records[i].uid] / xpTotal;
		}

		talkativity = _talkativity;
	},
	
	/* Calculates the XP to be awarded based on messages' content */
	/* XP is awarded for words, attachments, links and code differently */
	/* Replies are not awarded XP */
	calculateXP: function(msg, category)
	{
		var ltext = msg.content;
		var lines = ltext.split("\n");
		
		var words;
		var http;
		var www;
		
		var academic = 0;
		var general  = 0;
		var media    = msg.attachments.array().length * 3;
		
		if(Commons.codeTest(ltext)>4)
		{	for(var i=0; i<lines.length ;i++)
				if(Commons.noWhitespace(lines[i]) > 5 && lines[i][0]!='>')
					academic++;
		}
		else
		{
			for(var i=0; i<lines.length; i++)
				if(lines[i].length>0 && lines[i][0]!='>')
				{	
					var http  = Commons.count(lines[i], "http");
					var www   = Commons.count(lines[i], "www" );
					media += (http > www ? http : www) * 3;
					
					words= lines[i].split(' ');
					general+=words.length;
				}
		}
		
		if(media > 0)    module.exports.giveXP(msg, 'm', media);
		if(academic > 0) module.exports.giveXP(msg, 'a', academic);
		if(general > 0)  module.exports.giveXP(msg, category, general);
	},
	
	/* Awards the user XP in the XP tables and monitors who levels up */
	giveXP: function(msg, category, amount)
	{
		/* Find the record of the user in the XP tables */
		var tidx = module.exports.totalXP.findIndex(e=> e.uid==msg.author.id);
		var gidx = module.exports.gainedXP.findIndex(e=> e.uid==msg.author.id);
		var sidx = module.exports.seasonXP.findIndex(e=> e.uid==msg.author.id);
		var inst = module.exports.totalXP[tidx];
		var ding = { res: false, lv:0};
		
		/* Quit if the user is not found */
		if(sidx==-1) return;

		/* Get user talkativity percentage */
		var userTalk = talkativity[msg.author.id];

		// This may be redundant but more of a fail safe since im not sure what it will look like for users speaking for the first time that day
		if(userTalk == null) userTalk = 0;

		// Modify amount to factor user talkativity
		if(xpTotal > 500)
			amount *= XPCurve(userTalk);
		
		/* Award XP based on category */
		switch(category)
		{
			case 'g':	ding = leveled(inst.g, inst.m, inst.b, inst.a, amount/2);
						module.exports.totalXP[tidx].g += amount;
						module.exports.gainedXP[gidx].g+= amount;
						module.exports.seasonXP[sidx].g1+= amount;
						break;
						
			case 'm': 	ding = leveled(inst.g, inst.m, inst.b, inst.a, amount);
						module.exports.totalXP[tidx].m += amount;
						module.exports.gainedXP[gidx].m+= amount;
						module.exports.seasonXP[sidx].m1+= amount;
						break;
						
			case 'b': 	ding = leveled(inst.g, inst.m, inst.b, inst.a, amount/4);
						module.exports.totalXP[tidx].b += amount;
						module.exports.gainedXP[gidx].b+= amount;
						break;
						
			case 'a': 	ding = leveled(inst.g, inst.m, inst.b, inst.a, amount);
						module.exports.totalXP[tidx].a += amount;
						module.exports.gainedXP[gidx].a+= amount;
						module.exports.seasonXP[sidx].a1+= amount;
						break;
		}
		
		/* Display a message and award currency if the user leveled up */
		if(ding.res)
		{
			DB.pool()
				.query( "UPDATE user_profile " +
						"SET coins=coins+100 " +
						"WHERE uid="+msg.author.id)
				.catch(err=>
				{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
					"Failed to level up the user");
				});
				
			msg.channel.send("🎉**    " + msg.author.toString() + "  Leveled UP!!    Now Lv. "+ding.lv+"    **🎊");
		}
	},

	/* Save the volatile XP Data in the Database and resets it to 0 */
	uploadXP: function()
	{
		var xpTable = module.exports.gainedXP;
		var text = "";
		
		for(var i=0; i<xpTable.length; i++)
		{	
			if(xpTable[i].g+xpTable[i].m+xpTable[i].b+xpTable[i].a > 0)
			text +=	"UPDATE user_xpg "+
					"SET general=general+"+xpTable[i].g +", " + "media=media+"+xpTable[i].m +", " + "bots=bots+"+xpTable[i].b +", " + "academic=academic+"+xpTable[i].a+ " " +
					"WHERE uid="+ xpTable[i].uid + ";\n"+
					"UPDATE user_xps "+
					"SET g1=g1+"+xpTable[i].g +", " + "m1=m1+"+xpTable[i].m +", " + "a1=a1+"+xpTable[i].a+ " " +
					"WHERE uid="+ xpTable[i].uid + ";\n"
		}

		DB.pool()
			.query(text)
			.then( res=>
			{	/* Reset the volatile XP to 0 */
				for(var i=0; i<module.exports.gainedXP.length; i++)
				{	module.exports.gainedXP[i].g=0;
					module.exports.gainedXP[i].m=0;
					module.exports.gainedXP[i].b=0;
					module.exports.gainedXP[i].a=0;
				}
			})
			.catch(err=>
			{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to save volatile XP data to the Database");
			});

	},
	
	/* Shifts seasonal XP to be worth less after the day rolls over */
	shiftXP: function()
	{
		DB.pool()
			.query(	"UPDATE user_xps SET g3=g2, m3=m2, a3=a2;\n" +
					"UPDATE user_xps SET g2=g1, m2=m1, a2=a1;\n" +
					"UPDATE user_xps SET g1=0,  m1=0,  a1=0; \n"
			)
			.then( res=>
			{	/* Reset the volatile XP to 0 */
				for(var i=0; i<module.exports.seasonXP.length; i++)
				{	module.exports.seasonXP[i].g3=module.exports.seasonXP[i].g2;
					module.exports.seasonXP[i].g2=module.exports.seasonXP[i].g1;
					module.exports.seasonXP[i].g1=0;
					
					module.exports.seasonXP[i].m3=module.exports.seasonXP[i].m2;
					module.exports.seasonXP[i].m2=module.exports.seasonXP[i].m1;
					module.exports.seasonXP[i].m1=0;
					
					module.exports.seasonXP[i].a3=module.exports.seasonXP[i].a2;
					module.exports.seasonXP[i].a2=module.exports.seasonXP[i].a1;
					module.exports.seasonXP[i].a1=0;
				}
			})
			.catch(err=>
			{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to shift seasonal XP data in the Databas");
			});
	},

	/* Sets the ranked roles of users on the seasonal leaderboards */
	setRanks: function(client)
	{
		/* Getting the current sorted seasonal rankings */
		var records  = module.exports.seasonXP;
		var rankings = [];	

		for(var i=0; i<records.length; i++)
		{	var name = records[i].nickname !== null ? records[i].nickname : records[i].username;
			var xp   = (records[i].g1/2 + records[i].m1 + records[i].a1) + (records[i].g2/2 + records[i].m2 + records[i].a2)/2 + (records[i].g3/2 + records[i].m3 + records[i].a3)/4;
			rankings.push({score:xp, id:records[i].uid, name:name});
		}

		rankings = rankings.sort(function (a,b) { return b.score - a.score;});
		rankings = rankings.splice(0,3);
		
		var gld = client.guilds.cache.get(GLD_UNIVERSITY);
		var fst = gld.channels.cache.get('744570496586219631');
		var snd = gld.channels.cache.get('744576541727391786');
		var trd = gld.channels.cache.get('744576556197871717');
		
		fst.setName("🥇" + rankings[0].name.substr(0,20));
		snd.setName("🥈" + rankings[1].name.substr(0,20));
		trd.setName("🥉" + rankings[2].name.substr(0,20));
		
		return;
	}
}