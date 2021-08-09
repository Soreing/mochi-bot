const { Client, RichEmbed,  MessageEmbed} = require('discord.js');
const Commons = require('./commons.js');

const EMOTE_COIN   = "<:coin_img:743056604844392479>"; 
const EMOTE_GEM    = "<:gem_img:744203866458947679>";
const EMOTE_HEALTH = "<:hp_img:743082568886517850>"; 
const EMOTE_FOOD   = "<:food_img:744203866211614740>";
const EMOTE_CLEAN  = "<:clean_img:744203865699647528>";
const EMOTE_MOOD   = "<:mood_img:744203866718994503>";
const EMOTE_ATK    = "<:atk_img:744203865271828560>";
const EMOTE_DEF    = "<:def_img:744203865770950676>";
const EMOTE_SPD    = "<:spd_img:744203866991755275>";
const EMOTE_LUK    = "<:luk_img:744203866391969854>";
const EMOTE_ENERGY = "<:energy_img:743092637669785721>";

module.exports = {
	
	/* Creates an embed that will be sent to verified users */
	welcome: function welcome(usr)
	{
		var embed = new MessageEmbed();
	
		embed.setColor(0xC04747);
		embed.setTitle("Welcome to the server!");
		embed.setDescription("Hi "+ usr.username +", you've just been verified on the UOWD community discord server!");
		embed.setThumbnail("https://cdn.discordapp.com/attachments/526814911213338628/665658676203487263/Discord_monochrome.png"); 
		
		embed.addField("\u200B", "**More Information**\nYou can read more about the server on a new channel <#609046559493193778> which has extended information to what you've seen before verification.", false);
		embed.addField("\u200B", "**Banter**\nBanter and teasing is allowed, but if you think things are getting too far, you can react with <:banhammer:659834999243145277> on messages to flag them, and the moderator team will manually review it.", false);
		embed.addField("\u200B", "**Media Channels**\nThe server has a couple of media related channels (games, series, memes, music, pets, etc..) that are hidden by default. You can go to <#663119103393005579> to opt-in to these channels and get access.", false);
		embed.addField("\u200B", "**Subject Channels**\nIf you are taking subjects listed in <#609046559493193778>, you can ask to get a role to access the exclusive channels for subject discussions.", false);

		embed.setFooter(Commons.timeStamp());
		return embed;
	},
	
	/* Creates an embed for automatically flagged messages */
	automaticFlag: function automaticFlag (msg, word)
	{
		var embed = new MessageEmbed();
	
		embed.setColor(0xFF0000);
		embed.setTitle(Commons.timeStamp()+" Automatic Flagging");
		embed.setDescription("Flagged a message from "+msg.author.toString()+" in "+ msg.channel.toString() + " for containing the word \""+word+"\"");
		
		embed.addField("**Message**\n"+msg.content.substring(0, 200) + (msg.content.length > 200 ? "[ CONTINUED ]" : ""), "\u200B", false);
		embed.addField("**Link**\n", msg.url, false);

		return embed
	},
	
	/* Creates an embed for manually flagged messages */
	manualFlag: function manualFlag(msg, usr)
	{
		var embed = new MessageEmbed();
	
		embed.setTitle(Commons.timeStamp()+" Manual Flagging");
		embed.setDescription(usr.toString()+" flagged a message from "+msg.author.toString()+" in "+ msg.channel.toString());
		embed.setColor(0xFF0000);
		
		embed.addField("**Message**\n"+msg.content.substring(0, 200) + (msg.content.length > 200 ? "[ CONTINUED ]" : ""), "\u200B", false);
		embed.addField("**Link**\n", msg.url, false);

		return embed;
	},
	
	/* Creates an embed for updated messages */
	msgUpdated: function msgUpdated(oldmsg, newmsg)
	{
		var embed = new MessageEmbed();
		
		embed.setColor(0x7ac9d6);
		embed.setTitle(Commons.timeStamp()+" Message Updated");
		embed.setDescription("From "+oldmsg.author.toString()+" in "+oldmsg.channel.toString());
		
		embed.addField("**Before\n**"+oldmsg.content.substring(0, 200) + (oldmsg.content.length > 200 ? "[ CONTINUED ]" : ""), "**After\n**"+newmsg.content.substring(0, 200) + (newmsg.content.length > 200 ? "[ CONTINUED ]" : ""), false);

		return embed;
	},	
	
	/* Creates an embed for deleted messages */
	msgDeleted: function msgDeleted(msg)
	{
		var embed = new MessageEmbed();
			
		embed.setTitle(Commons.timeStamp()+" Message Deleted");
		embed.setDescription("From "+msg.author.toString()+" in "+ msg.channel.toString());
		embed.setColor(0x7ac9d6);
		
		embed.addField("**Message**\n"+msg.content.substring(0, 200) + (msg.content.length > 200 ? "[ CONTINUED ]" : ""), "\u200B", false);

		return embed;
	},
	
	/* First page of the shop */
	shop1: function shop1()
	{
		var embed = new MessageEmbed();
		
		embed.setDescription("[use .buy \"item_name\" to purchase items]\n[use .shop \"page_number\" to see more items]");
		embed.addField("Shop (1/3) - Profile", "\u200B", false);
		
		embed.addField(	"**__Badges__**", 
						"`9999`"+EMOTE_COIN+" - **b1**  :I am Rich\n"+
						"`​ 300`"+EMOTE_GEM +" - **b2** :Challenge Accepted", false);
		
		embed.addField(	"**__Decorative__**", 
						"​`​ ​ 10`"+EMOTE_COIN+" - **nc \"hex\"** :Name Color (ex. nc FFFFFF) \n"+
						"`​ ​ 10`"+EMOTE_COIN+" - **tc \"hex\"**  :Title Color (ex. tc FFFFFF) \n"+
						"`1000`"+EMOTE_COIN+" - **bg \"URL\"** Background (800x400)", false);
		return embed;
	},
	
	/* Second page of the shop */
	shop2: function shop2()
	{
		var embed = new MessageEmbed();
		
		embed.setDescription("[use .buy \"item_name\" to purchase items]");
		embed.addField("Shop (2/3) - Titles ", "\u200B", false);
		
		embed.addField(	"**__Titles__**", 
						"`​ 200`"+EMOTE_COIN+"  - **t1** :Thinker of Deep Thoughts\n"+
						"`​ 200`"+EMOTE_COIN+" - **t2** :The Voice of Reason\n"+
						"`​ 100`"+EMOTE_COIN+" - **t3** :Self Professed Genius\n"+
						"`​ 100`"+EMOTE_COIN+" - **t4** :Annoying Bastard\n"+
						"`​ 100`"+EMOTE_COIN+" - **t5** :Drama Queen\n"+
						"`​ 200`"+EMOTE_COIN+" - **t6** :Omae wa mou shindeiru\n"+
						"`​ 500`"+EMOTE_COIN+" - **t7** :Professional Gambler\n"+
						"`​ ​ 50`"+EMOTE_GEM +" - **t8** :Nerd Without Shame", false);

		return embed;
	},
	
	/* Third page of the shop */
	shop3: function shop3()
	{
		var embed = new MessageEmbed();
		
		embed.setDescription("[use .buy \"item_name\" to purchase items]");
		embed.addField("Shop (3/3) - Pets ", "\u200B", false);
		
		embed.addField(	"**__Pets__**", 
						"`1000`"+EMOTE_COIN+" |"+EMOTE_ATK+" `​ 5` | "+EMOTE_DEF+" `​ 7` | "+EMOTE_SPD+" `​ 9` | "+EMOTE_LUK+" `​ 5` | - **Turtle**\n" +
						"`1000`"+EMOTE_COIN+" |"+EMOTE_ATK+" `​ 6` | "+EMOTE_DEF+" `​ 5` | "+EMOTE_SPD+" `11` | "+EMOTE_LUK+" `​ 3` | - **Llama**\n" +
						"`1000`"+EMOTE_COIN+" |"+EMOTE_ATK+" `​ 7` | "+EMOTE_DEF+" `​ 4` | "+EMOTE_SPD+" `10` | "+EMOTE_LUK+" `​ 5` | - **Duck**\n" +
						"`1000`"+EMOTE_COIN+" |"+EMOTE_ATK+" `​ 5` | "+EMOTE_DEF+" `​ 5` | "+EMOTE_SPD+" `11` | "+EMOTE_LUK+" `​ 7` | - **Cat**\n", false);
		embed.addField(	"​", 				
						"`1000`"+EMOTE_COIN+" |"+EMOTE_ATK+" `​ 7` | "+EMOTE_DEF+" `​ 7` | "+EMOTE_SPD+" `​ 7` | "+EMOTE_LUK+" `​ 5` | - **Rock**\n" +
						"`1000`"+EMOTE_COIN+" |"+EMOTE_ATK+" `​ 4` | "+EMOTE_DEF+" `​ 4` | "+EMOTE_SPD+" `​ 9` | "+EMOTE_LUK+" `10` | - **Plant**\n" +
						"`1000`"+EMOTE_COIN+" |"+EMOTE_ATK+" `​ 6` | "+EMOTE_DEF+" `​ 5` | "+EMOTE_SPD+" `11` | "+EMOTE_LUK+" `​ 4` | - **Dog**\n​", false);

		embed.addField(	"**__Habitats__**", 
						"`​ 500`"+EMOTE_COIN+" - **Snow**\n" +
						"`​ 500`"+EMOTE_COIN+" - **Desert**\n" +
						"`​ 500`"+EMOTE_COIN+" - **City**\n" +
						"`​ 500`"+EMOTE_COIN+" - **Cave**", false);

		return embed;
		
	},
	
	/* Creates an embed with general information */
	infHelp: function()
	{
		var embed = new MessageEmbed();
		
		embed.setTitle("Mochi - Help");
		embed.setThumbnail('https://cdn.discordapp.com/attachments/526814911213338628/667087556852056075/656574346482941974.png');
		embed.setDescription("Mochi is an exclusive bot to this server with a few features. For explanation of user pets, type `.pet help` instead.");
	
		embed.addField("\u200B","__**Global Commands**__ (works everywhere)",false);
		embed.addField("`.profile`","Shows your Profile Card with titles, badges, currencies, level and a breakdown to how active you are in the different channel categories (**G**)-General, (**M**)-Media, (**B**)-(Bots), (**A**)-Academic",false);
		embed.addField("`.rank` / `.allrank`","Shows your ranking on the server based on your daily or all time activity",false);
		
		embed.addField("\u200B","__**Other Commands**__ (works only in <#597927626958700545>)",false);
		embed.addField("`.work`","Gives you "+EMOTE_COIN+" to spend. You can work every 15 minutes",true);
		embed.addField("`.shop`","Shows different items available for purchase.",true);
		embed.addField("`.buy`","Purchase items from the shop by specifying their tag name",true);
		embed.addField("`.titles`","Shows all unlocked titles, `set` sets your title by ID",true);
		embed.addField("`.settitle`","Sets your profile title by ID",true);
		embed.addField("\u200B","\u200B",true);
		
		embed.addField("\u200B","**Last edited: " + Commons.timeStamp() + "**", true);
		return embed;
	},
	
	/* Creates an embed with information on pets */
	infPets: function()
	{
		var embed = new MessageEmbed();
		
		embed.setTitle("Mochi - Pets");
		embed.setThumbnail('https://cdn.discordapp.com/attachments/526814911213338628/667087556852056075/656574346482941974.png');
		embed.setDescription("You can buy pets from `.shop pets` using `.buy`. You can interact with your pet, take care of it, raise stats and fight others. For a list of actions for your pet, use the command `.pet actions`");
	
		embed.addField("\u200B","__**Pet Settings**__",false);
		embed.addField("`.pets`","Lists all the pets you have locked or unlocked",true);
		embed.addField("`.setpet \"ID\"`","Sets your current pet to the one indicated by ID from the pet list",true);
		embed.addField("`.showpet`","Shows your Profile Card of your pet with its statistics",true);
		embed.addField("`.namepet`","Sets the name of your pet (15 characters max, no spaces)",true);
		embed.addField("`.petrank`","Displays a ranking of pets based on fighting (use `.fight`)",true);
		embed.addField("`.habitats`","Lists all the pet habitats you have locked or unlocked",true);
		embed.addField("`.sethabitat`","Sets the habitat of your pets to the one indicated by ID from the habitat list",true);
		embed.addField("\u200B","\u200B", true);
		embed.addField("\u200B","\u200B", true);
	
		embed.addField("\u200B","__**Pet Stats**__",false);
		embed.addField(EMOTE_HEALTH +" - Life","The amount of HP your pet has (max 100 + 10*level)",true);
		embed.addField(EMOTE_FOOD   +" - Food","The amount of stored up food your pet has (max 100)",true);
		embed.addField(EMOTE_CLEAN  +" - hygiene","The level of cleanliness of your pet (max 100)",true);
		embed.addField(EMOTE_MOOD   +" - Mood","The mood level of your pet (max 100)",true);
		embed.addField(EMOTE_ENERGY +" - Stamina","The energy of your pet to do actions (max 100)",true);
		embed.addField(EMOTE_ATK    +" - Attack","The points of damage your pet does when attacking",true);
		embed.addField(EMOTE_DEF    +" - Defense","50% of defense damage negated when your pet is attacked",true);
		embed.addField(EMOTE_SPD    +" - Speed","Decides how often your pet gets to attack (every 100 speed points)",true);
		embed.addField(EMOTE_LUK    +" - Luck","Percentage of doing 50% more damage or taking 50% less damage",true);
		
		embed.addField("\u200B","**Last edited: " + Commons.timeStamp() + "**", false);
		return embed;
	},
	
	/* Creates an embed with information what you can do with pets */
	infPetActions: function()
	{
		var embed = new MessageEmbed();
		
		embed.setTitle("Mochi - Pet Actions");
		embed.setThumbnail('https://cdn.discordapp.com/attachments/526814911213338628/667087556852056075/656574346482941974.png');
		embed.setDescription("You can do the following actions with your selected pet. Pets regenerate 1<:energy:666627720888713246> every 3 minutes if they have <:food:667092257320599573><:hygiene:667092257567932426><:mood:667092257207484427> above 0");
	
		embed.addField("\u200B","__**Actions**__",false);
		embed.addField("`.feed`","Refills the pet's food stat to 100 for the cost of 1"+EMOTE_COIN+" per 1"+EMOTE_FOOD+" required. It decrements every 15 minutes",true);
		embed.addField("`.clean`","Refills the pet's hygiene stat to 100 for the cost of 1"+EMOTE_COIN+" per 1"+EMOTE_CLEAN+" required. It decrements every 15 minutes",true);
		embed.addField("`.play`","Refills the pet's mood stat to 100 for the cost of 1"+EMOTE_COIN+" per 1"+EMOTE_MOOD+" required. It decrements every 15 minutes",true);
		embed.addField("`.hunt`","Send your pet to hunt. It gains 2"+EMOTE_ATK+"xp and 2"+EMOTE_DEF+"xp and loses some "+EMOTE_HEALTH+". If your pet faints, it loses all <:energy:666627720888713246>",true);
		embed.addField("`.beat`","Discipline your pet harshly. It gains 3"+EMOTE_ATK+"xp",true);
		embed.addField("`.train`","Train your pet. It gains 1"+EMOTE_ATK+"xp and 1"+EMOTE_SPD+"xp",true);
		embed.addField("`.walk`","Take your pet for a walk. It gains 1"+EMOTE_DEF+"xp and 1"+EMOTE_SPD+"xp",true);
		embed.addField("`.trick`","Teach your pet some tricks. It gains 1"+EMOTE_SPD+"xp and 1"+EMOTE_LUK+"xp",true);
		embed.addField("`.search`","Send your pet to search the area. You gain 1"+EMOTE_COIN+"",true);
		embed.addField("`.pat`","Spend some quality time with your pet. It gains 25"+EMOTE_HEALTH+"",true);
		embed.addField("`.fight @user`","Challenges someone who owns a pet to get higher in the rankings",true);

		embed.addField("\u200B","**Last edited: " + Commons.timeStamp() + "**", false);
		return embed;
	},
	
	/* Creates an embed with information on Rules */
	infRules: function rules()
	{
		var embed = new MessageEmbed();
		
		embed.setTitle("Information - Rules");
		embed.setColor(0xFF0000);
		embed.setDescription("The rules are more like guidelines. Moderators enforce them as they see fit. You will only be punished if you cause an issue or you're too much to handle.\n\u200B");
	
		embed.addField("**__Write and speak only in english__**","\u200B",false);
		embed.addField("-- Very Serious --","-Follow Discord's Terms of Service\n-No politics, especially UAE politics\n-No NSFW media on the server\n-No doxing or guessing at people's identities\n",false);
		embed.addField("-- Mildly Serious --","-Don't target, shame, impersonate or be too rude\n-Don't spam or mention users too much\n-Don't advertise yourself or your services\n-Don't encourage piracy or plagiarism\n-Don't use Discord in class too much\n-Don't talk about faculty too disrespectfully\n",false);
		embed.addField("-- Please Be Nice --","-Only use nicknames that can be mostly typed on an english keyboard\n-Keep conversations somewhat relevant to the channels' purpose\n",false);
		embed.addField("\u200B","**Last edited: " + Commons.timeStamp() + "**", true);
		
		return embed;
	},
	
	/* Creates an embed with information on Roles */
	infRoles: function roles()
	{
		var embed = new MessageEmbed();
		
		embed.setTitle("Information - Roles");
		embed.setColor(0xFFA500);
		embed.setDescription("Roles help identify different users quickly and grant different permissions based on a hierarchy.\n\u200B");

		embed.addField("-- Moderation Roles --","-**__Admins__** can edit roles and channel permissions\n-**__Moderators__** enforce rules and delete messages\n-**__S.Moderators__** do the same in subject channels\n-**__Ranched__** users can't send messages\n-**__Banned__** users can't see messages or channels\n",false);
		embed.addField("-- User Roles --","-**__Students__** currently study at UOWD\n-**__Graduates__** graduated at UOWD\n-**__Peer Tutors__** are students teaching subjects\n-**__Industry Guests__** are not part of UOWD\n",false);
		embed.addField("-- Subject Roles --","Specific subjects have their private discussion channels. If you take a subject, tell me and you get a role to access it. See the list of channels available in the next section",false);
		embed.addField("\u200B","**Last edited: " + Commons.timeStamp() + "**", true);
		
		return embed;
	},
	
	/* Creates an embed with information on channels */
	infChannels: function channels()
	{
		var embed = new MessageEmbed();
		
		embed.setTitle("Information - Channels");
		embed.setColor(0xFFFF00);
		embed.setDescription("There are 50+ channels in total, most of them hidden to reduce the information load on new users.\n\u200B");
	
		embed.addField("-- Information --","**__#information__**: Detailed information on the server\n**__#announcements__**: News and Updates on the server\n**__#media-channels__**: Channel used to opt-in to MEDIA channels\n",false);
		embed.addField("-- General --","**__#suggestions__**: Send ideas that will be considered\n**__#confessions__**: Send anonymous messages\n**__#general-1__**: Primary channel for all conversations\n**__#general-2__**: Secondary channel for \"serious\" topics\n",false);
		embed.addField("-- Computer Science --","**__#computer-science__**: General talk on useful CS topics\n**__#digital-security__**: Specific talk on DS topics\n**__#game-development__**: Specific talk on Game-Dev topics\n**__#coding-challenges__**: Some coding questions for practice\n",false);
		embed.addField("-- Media --","**__#anime__**: Talking about anime, manga, weebs, etc.\n**__#books__**: Talking about books, novels, etc.\n**__#bot-help__**: Help on how to use bots in bot-spam\n**__#bot-spam__**: Using bots and spamming commands\n**__#movies-series__**: Talk on Movies/Series/Videos\n**__#memes__**: Sharing or requesting Memes from bots\n**__#games__**: Talk on games, news, chatting while gaming\n**__#music__**: Sharing music with each other\n**__#pets__**: Talking or posting images about pets\n**__#food__**: Talking or posting images about food\n**__#cars__**: Discussing or images about cars 'n stuff\n**__#art__**: Posting and shitting on art\n",false);
		embed.addField("-- Subjects --","Discussion channels for subjects:\n`#csci376  #csci369  #csci366  #csci361`\n`#csci358  #csci356  #csci346  #csci336`\n`#csci323  #csit321  #csit314  #csci262`\n`#csci251  #csit242  #csci236  #csci235`\n`#csit226  #math221  #csit214  #csit212`\n`#csci203  #csit128  #csit127  #csit121`\n`#csit115  #csit114  #csit113  #csit111`\nDiscontinued subjects:\n`#ex_csci319  #ex_csci212  #ex_csci131`",false);

		embed.addField("\u200B","**Last edited: " + Commons.timeStamp() + "**", true);
		
		return embed;
	},
	
	/* Creates an embed of a list of pets and their unlocked state */
	listOfPets: function(pets, unlocks)
	{
		var embed = new MessageEmbed();
		embed.setDescription("**__Pet List__**" + Commons.repeat(" ​", 35));
		
		/* Construct and add the pets text field */
		var petfld = "";
		for(var i=0; i< pets.length; i++)
		{	var name = "`"+pets[i].name + Commons.repeat(" ​", 6-pets[i].name.length)+"`";
			petfld += "`"+pets[i].pid + "`:  " + pets[i].emote + " "+ name + (unlocks.includes(pets[i].pid) ? "" : " [LOCKED]") + "\n";
		}
		
		embed.addField("\u200B",petfld, true);
		return embed;
	},
	
	/* Creates an embed of a list of habitats and their unlocked state */
	listOfHabitats: function(habitats, unlocks)
	{
		var embed = new MessageEmbed();
		embed.setDescription("**__Habitat List__**" + Commons.repeat(" ​", 45));
		
		/* Construct and add the pets text field */
		var habfld = "";
		for(var i=0; i< habitats.length; i++)
		{	var name = "`"+habitats[i].name + Commons.repeat(" ​", 12-habitats[i].name.length)+"`";
			habfld += "`"+habitats[i].hid + "`:  " + habitats[i].emote + " "+ name + (unlocks.includes(habitats[i].hid) ? "" : " [LOCKED]") + "\n";
		}

		embed.addField("\u200B",habfld, true);
		return embed;
	},
	
	/* Creates a top ranking of pets */
	rankingOfPets: function(ranking, user)
	{
		var suffix = ["st", "nd", "rd"];
		
		var embed = new MessageEmbed();
		embed.setDescription("**__Pet Rankings__**" + Commons.repeat(" ​", 50));
		
		var field  = "";
		var number;
		for(var i=0; i<3 && i< ranking.length; i++)
		{
			number = (i+1) + suffix[i%10];
			number = "`" + Commons.repeat(" ​", 4-number.length) + number + "`";
			
			field +=	number + "  " + (ranking[i].memote === null ? ranking[i].cemote : ranking[i].memote) + " " + 
						(ranking[i].nickname === null ? ranking[i].username : ranking[i].nickname) + " - **(" + 
						(ranking[i].mname === null ? ranking[i].cname : ranking[i].mname)+ ")**\n";
		}
		
		var idx = ranking.findIndex( e => e.uid == user.id);
		console.log(idx);
		
		var sidx = idx-3;
		var eidx = idx+3;
		if(eidx > ranking.length) sidx -= eidx-ranking.length;
		if(sidx < 3) sidx = 3;
		
		for(var i=sidx; i<sidx+7 && i < ranking.length; i++)
		{
			number = (i+1) + (((i>9 && i<13) || ((i%10)>2)) ? "th" : suffix[i%10]);
			number = "`" + Commons.repeat(" ​", 4-number.length) + number + "`";
			
			field +=	number + "  " + (ranking[i].memote === null ? ranking[i].cemote : ranking[i].memote) + " " + 
						(ranking[i].nickname === null ? ranking[i].username : ranking[i].nickname) + " - **(" + 
						(ranking[i].mname === null ? ranking[i].cname : ranking[i].mname)+ ")**\n";
		}
		
		embed.addField("\u200B",field, true);
		return embed;
	},
	
	/* Creates a top ranking of users */
	rankingOfUsers: function(ranking, user)
	{
		var suffix = ["st", "nd", "rd"];
		var medal  = ["<:1st_img:743487647271354408>", "<:2nd_img:743487647992905838>", "<:3rd_img:743487648567394325>"];
		
		var embed = new MessageEmbed();
		embed.setDescription("**__User Rankings__**" + Commons.repeat(" ​", 50));
		
		var field  = "";
		var number;
		var pts;
		for(var i=0; i<3 && i< ranking.length; i++)
		{
			number = (i+1) + suffix[i%10];
			number = "`" + Commons.repeat("​ ", 4-number.length) + number + "`" + medal[i%10];
			
			pts = Math.floor(ranking[i].score)+"";
			pts = "`"+Commons.repeat("​ ", 6-pts.length) + pts + "`";
			
			field += number + pts + "  **" + ranking[i].name.substr(0,20).replace(/[`*_~]/gi, "") +"**\n";
		}
		
		var idx = ranking.findIndex( e => e.id == user.id);
		
		var sidx = idx-3;
		var eidx = idx+3;
		if(eidx > ranking.length) sidx -= eidx-ranking.length;
		if(sidx < 3) sidx = 3;
		
		if(sidx>3)
			field += "` ... `\n";
		
		for(var i=sidx; i<sidx+7 && i < ranking.length; i++)
		{
			number = (i+1) + (((i>9 && i<13) || ((i%10)>2)) ? "th" : suffix[i%10]);
			number = "`" + Commons.repeat("​ ", 4-number.length) + number + "`<:null_img:743487648416661506>";
			
			pts = Math.floor(ranking[i].score)+"";
			pts = "`"+Commons.repeat("​ ", 6-pts.length) + pts + "`";
			
			field += number + pts + "  **" + ranking[i].name.substr(0,20).replace(/[`*_~]/gi, "") +"**\n";
		}
		
		embed.addField("\u200B",field, true);
		return embed;
	},
	
	/* Creates an embed of the media channels */
	mediaChannels: function()
	{
		var embed = new MessageEmbed();
	
		embed.setTitle("Request Media Channels");
		embed.setDescription("React to the following emotes to opt in or out of specific media channels");
		embed.setColor(0x7ac9d6);
				
		var options = ""+
			"<:senko:663118396925280268> **- Anime and Manga**\n" +
			"📖 **- Books and Reading**\n"+
			"<:ping:663118396237545512> **- Bot Spam and Bot Help\n**" +
			"<:game:663118397503963137> **- Video Games\n** "+
			"<:okay:663127063930339381> **- Memes and Media\n**"+
			"📺 **- Movies and Series** \n"+
			"🎶 **- Songs and Music**\n" +
			"🐶 **- Pets and Animals** \n"+
			"🍔 **- Cooking and Food**\n"+
			"🚗 **- Cars and Vehicles**\n" +
			"🎨 **- Art (Not Shitty)**" ;
			
		embed.addField("\u200B", options, false);

		return embed;
	},
};