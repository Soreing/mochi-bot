const Commons  = require('./commons.js');
const DB       = require('./database.js');
const Embeds  = require('./embeds.js');

const { createCanvas, loadImage, Image } = require('canvas');
const { Client, RichEmbed,  MessageEmbed} = require('discord.js');

const EMOTE_COIN   = "<:coin_img:743056604844392479>"; 
const EMOTE_HEALTH = "<:hp_img:743082568886517850>"; 
const EMOTE_ENERGY = "<:energy_img:743092637669785721>"; 

/* Constructs statistics for a pet */
function petData(axp, dxp, sxp, lxp, hcur, inhxp)
{
	var rem = axp+dxp+sxp+lxp-inhxp;
	var lim=100;
	var lv=0, a=0, d=0, s=0, l=0;
	
	for(lim=100; axp>lim; lim*=1.1) { a++; axp-=lim;  }; axp=axp/lim;
	for(lim=100; dxp>lim; lim*=1.1) { d++; dxp-=lim;  }; dxp=dxp/lim;
	for(lim=100; sxp>lim; lim*=1.1) { s++; sxp-=lim;  }; sxp=sxp/lim;
	for(lim=100; lxp>lim; lim*=1.1) { l++; lxp-=lim;  }; lxp=lxp/lim;
	for(lim=100; rem>lim; lim*=1.1) { lv++; rem-=lim; };
	
	return {level:lv+1, progress:rem/lim, a:a+1, d:d+1, s:s+1, l:l+1, maxhp:lv*10+100, hp:hcur, al:axp, dl:dxp, sl:sxp, ll:lxp, };
}

/* Constructs a Profile Card for the pet or the mentioned user's pet */
/* The card includes the image, name, stats and currency */
async function pet(msg)
{	
	const canvas = createCanvas(800, 400)
	const ctx = canvas.getContext('2d');
	
	/* Picking the target, either the user or the mentioned user */
	var mentions = msg.mentions.members.array();
	var user = mentions.length ==0 ? msg.author : mentions[0].user;
	
	var record  = null;
	var usrPet  = null;
	var habitat = null
	var images  = null;
	var imagePromises = [];
	
	/* Requesting the user profile details */
	record = DB.pool()
		.query( "SELECT users.uid, username, nickname, background, current, coins, gems "+
				"FROM public.users "+
				"INNER JOIN user_profile ON users.uid=user_profile.uid "+
				"INNER JOIN pet_settings ON users.uid=pet_settings.uid "+
				"WHERE users.uid="+user.id)
		.then(res=> {return res.rows[0]})
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to get " + user.username + "'s record");
			return;
		});
		
	/* Requesting the user pet details */
	usrPet = DB.pool()
		.query( "SELECT user_pets.name AS name, pets.name AS defname, food, clean, mood, energy, user_pets.attack, user_pets.defense, "+
					"user_pets.speed, user_pets.luck, user_pets.life, inherited, habitats.image AS habitat, pets.image " +
				"FROM public.pet_settings " +
				"INNER JOIN user_pets ON user_pets.pid=pet_settings.current AND user_pets.uid=pet_settings.uid " +
				"INNER JOIN habitats ON user_pets.habitat=habitats.hid " +
				"INNER JOIN pets ON pet_settings.current=pets.pid " +
				"WHERE pet_settings.uid="+user.id)
		.then(res=> {return res.rows[0]})
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to get " + user.username + "'s current record");
			return;
		});

	record = await Promise.resolve(record);
	usrPet = await Promise.resolve(usrPet);

	/* Quit if no pet is found */		
	if(record.current === null) { msg.channel.send("No Pet Found"); return; }

	/* Check if the user's avatar changed. If so, download and cache it */
	if(record.avatarURL!=user.displayAvatarURL)
	{
		const avatar = createCanvas(256, 256)
		const actx = avatar.getContext('2d');
		
		
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
	
	/* Loading Profile and Pet Images */
	imagePromises.push(Commons.loadImage(record.background !== null ? ('images/backgrounds/'+record.uid+'.png') : 'images/default.png'));
	imagePromises.push(Commons.loadImage('images/template_pet.png'));
	imagePromises.push(Commons.loadImage('images/avatars/'+record.uid+'.png'));
	imagePromises.push(Commons.loadImage(usrPet.habitat));
	imagePromises.push(Commons.loadImage(usrPet.image));

	/* Calculate pet stats */
	var stats = petData(usrPet.attack, usrPet.defense, usrPet.speed, usrPet.luck, usrPet.life, usrPet.inherited);

	/* Construct Background */
	images = await Promise.all(imagePromises);
	ctx.drawImage(images[0], 0,0, 800, 400);
	ctx.drawImage(images[1], 0, 0);
	ctx.drawImage(images[2], 30, 20, 145, 145);
	ctx.drawImage(images[3], 214, 187, 319, 213);
	ctx.drawImage(images[4], 214, 187, 319, 213);
	
	/* Add Name text */
	ctx.font      = 'bold 36px Tahoma';
	ctx.textAlign = 'left'; 
	ctx.fillStyle = 'black';
	ctx.fillText(usrPet.name, 190, 110);
	
	/* Add Title text */
	ctx.font      = '20px Tahoma';
	ctx.textAlign = 'left' ; 
	ctx.fillStyle = 'black';
	ctx.fillText((record.nickname !== null ? record.nickname : record.username)+"'s "+usrPet.defname, 190, 140);
	
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
	
	/* Add HP text */
	ctx.fillStyle = "black";
	ctx.textAlign = 'left';
	ctx.font = '20px Tahoma';
	ctx.fillText(stats.hp + " / " + stats.maxhp, 236, 172);
	
	/* Add Stats texts */
	ctx.fillStyle = "white";
	ctx.textAlign = 'left';
	ctx.font = 'bold 30px Tahoma';
	ctx.fillText(usrPet.food, 620, 227);
	ctx.fillText(usrPet.clean, 620, 277);
	ctx.fillText(usrPet.mood, 620, 327);
	ctx.fillText(usrPet.energy, 620, 377);
	
	ctx.fillText(stats.a, 738, 227);
	ctx.fillText(stats.d, 738, 277);
	ctx.fillText(stats.s, 738, 327);
	ctx.fillText(stats.l, 738, 377);
	
	ctx.fillStyle = "white";
	ctx.fillRect(725, 232, 2, -30);
	ctx.fillRect(725, 282, 2, -30);
	ctx.fillRect(725, 332, 2, -30);
	ctx.fillRect(725, 382, 2, -30);
	
	ctx.fillStyle = "green";
	ctx.fillRect(725, 232, 2, -30*stats.al);
	ctx.fillRect(725, 282, 2, -30*stats.dl);
	ctx.fillRect(725, 332, 2, -30*stats.sl);
	ctx.fillRect(725, 382, 2, -30*stats.ll);
	
	/* Draw XP Progressbar */
	ctx.fillStyle = '#7289DA';
	ctx.fillRect(33, 347, 146*stats.progress, 26);
	
	/* Send the Image to the channel */
	var imgbuffer = await canvas.toBuffer();
	msg.channel.send( { files: [imgbuffer] });
}

/* Lists all the pets in an embed with images*/
async function listPets(msg)
{
	/* Select all the pets in order */
	var pets  = DB.pool()
		.query(	"SELECT * "+
				"FROM pets "+
				"ORDER BY pid")
		.then(res => { return res.rows; })
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed get the pets from the database");
		});

	/* Select all the pets the user owns */
	var upets = DB.pool()
		.query(	"SELECT pid "+
				"FROM user_pets "+
				"WHERE uid=" + msg.author.id)
		.then(res => { return res.rows.map((p => p.pid)); })
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed get the user's pets from the database");
		});
	
	pets  = await Promise.resolve(pets);
	upets = await Promise.resolve(upets);
	
	msg.channel.send(Embeds.listOfPets(pets, upets));
}

/* Sets the current pet of the user */
async function setPet(msg, id, field)
{	
	/* Check if the given parameter is a valid integer */
	if(id === undefined || !Number.isInteger(parseInt(id)))
	{	msg.channel.send("Invalid ID");
		return;
	}
	
	var settings = DB.pool()
		.query(	"SELECT * "+
				"FROM pet_settings "+
				"WHERE uid=" + msg.author.id)
		.then(res => { return res.rows[0]; })
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed get the user's pets settings from the database");
		});
	
	/* Check if the user owns the pet */
	var unlocked = DB.pool()
		.query(	"SELECT user_pets.pid, pets.name AS pname, user_pets.name AS upname "+
				"FROM user_pets "+
				"INNER JOIN pets ON user_pets.pid=pets.pid "+
				"WHERE uid=" + msg.author.id + " and user_pets.pid=" + Commons.esc(id))
		.then(res => { return res.rows; })
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to check if the pet is unlocked");
		});
	
	var count = DB.pool()
		.query(	"SELECT COUNT(uid) AS count "+
				"FROM pet_settings "+
				"WHERE rank IS NOT NULL")
		.then(res => { return parseInt(res.rows[0].count)+1; })
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed get the count of ranked users in pet_settings");
		});
	
	settings = await Promise.resolve(settings);
	unlocked = await Promise.resolve(unlocked);
	count    = await Promise.resolve(count);
	
	
	/* Update the information in the Database */
	if(unlocked.length>0)
	{	await DB.pool()
			.query(	"UPDATE pet_settings "+
					"SET "+field+"="+Commons.esc(id) + (settings.rank===null ? (", rank="+ count + " ") : " ") +
					"WHERE uid=" + msg.author.id)
			.then(res=>
			{	msg.channel.send("**"+unlocked[0].pname+" ("+unlocked[0].upname+")** Selected");	
			})
			.catch(err=>
			{	msg.channel.send("Operation Failed");
				Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to set the user's current pet");
			});
	}
	else
		msg.channel.send("You do not have this pet unlocked");
}

/* Lists all the habitats in an embed with images*/
async function listHabitats(msg)
{
	/* Select all the habitats in order */
	var habitats  = DB.pool()
		.query(	"SELECT * "+
				"FROM habitats "+
				"ORDER BY hid")
		.then(res => { return res.rows; })
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed get all the habitats from the database");
		});

	/* Select all the pets the user owns */
	var uhabitats = DB.pool()
		.query(	"SELECT hid "+
				"FROM user_habitats "+
				"WHERE uid=" + msg.author.id)
		.then(res => { return res.rows.map((h => h.hid)); })
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed get the user's habitats from the database");
		});
	
	habitats  = await Promise.resolve(habitats);
	uhabitats = await Promise.resolve(uhabitats);
	
	msg.channel.send(Embeds.listOfHabitats(habitats, uhabitats));
}

/* Sets the habitat of the current pet of the user */
async function setHabitat(msg, id)
{
	/* Check if the given parameter is a valid integer */
	if(id === undefined || !Number.isInteger(parseInt(id)))
	{	msg.channel.send("Invalid ID");
		return;
	}
	
	/* Check if the user owns a pet */
	var petID = DB.pool()
		.query(	"SELECT * "+
				"FROM pet_settings "+
				"WHERE uid=" + msg.author.id)
		.then(res => { return res.rows[0].current; })
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed get the user's current pet from pet_settings");
		});
		
	/* Check if the user owns the habitat */
	var unlocked = DB.pool()
		.query(	"SELECT hid "+
				"FROM user_habitats "+
				"WHERE uid=" + msg.author.id + " and hid=" + Commons.esc(id))
		.then(res => { return res.rows.length > 0 ? true : false })
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to check if the habitat is unlocked");
		});
	
	
	petID    = await Promise.resolve(petID);
	unlocked = await Promise.resolve(unlocked);
	
	if(petID === null)
	{	msg.channel.send("You do not have a pet selected");
		return;
	}
	
	/* Update the information in the Database */
	if(unlocked)
	{	await DB.pool()
			.query(	"UPDATE user_pets "+
					"SET habitat="+Commons.esc(id)+" "+
					"WHERE uid=" + msg.author.id + " AND pid="+petID)
			.then(res=>
			{	msg.channel.send("New habitat selected");	
			})
			.catch(err=>
			{	msg.channel.send("Operation Failed");
				Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to set the user's current pet's habitat");
			});
	}
	else
		msg.channel.send("You do not have this habitat unlocked");
}
	
/* Sets the name of the currently selected pet (Max 16 chars) */
async function namePet(msg, tokens)
{
	/* Constructing a name from tokens and validating it */ 
	var ntokens = msg.content.split(" ");
	ntokens.splice(0,1);
	var name = Commons.esc(ntokens.join(' '));
	
	if(name.length > 16)
	{	msg.channel.send("Name can't be more than 16 characters long");
		return;
	}
	
	/* Check if the user owns a pet */
	var petID = await DB.pool()
		.query(	"SELECT * "+
				"FROM pet_settings "+
				"WHERE uid=" + msg.author.id)
		.then(res => { return res.rows[0].current; })
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed get the user's current pet from pet_settings");
		});
	
	/* Update the information in the Database */
	if(petID !== null)
	{	await DB.pool()
			.query(	"UPDATE user_pets "+
					"SET name='"+name+"' "+
					"WHERE uid=" + msg.author.id + " AND pid="+petID)
			.then(res=>
			{	msg.channel.send("Current pet's name changed to `"+name+"`");	
			})
			.catch(err=>
			{	msg.channel.send("Operation Failed");
				Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to set hte current pet's name");
			});
	}
	else
		msg.channel.send("You do not have a pet selected");
}

/* Sets the current pet's given parameter to 100 for 1 coin each point */
async function care(msg, parameter)
{	
	/* Get details about the user's pet and amount of currency */
	var coins = DB.pool()
		.query( "SELECT coins "+
				"FROM user_profile "+
				"WHERE uid=" + msg.author.id)
		.then(res=> {return res.rows[0].coins})
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed get the user's currency");
		});
	
	var pet = DB.pool()
		.query( "SELECT pid, name, "+parameter+" AS stat " +
				"FROM user_pets " +
				"INNER JOIN pet_settings ON user_pets.pid=pet_settings.current AND user_pets.uid=pet_settings.uid " +
				"WHERE user_pets.uid=" + msg.author.id)
		.then(res=> {return res.rows[0]})
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed get the user's current pet from pet_settings");
		});
	
	coins = await Promise.resolve(coins);
	pet   = await Promise.resolve(pet);
	
	/*  Error checking for no pet or not enough money */
	if(pet === undefined)
		return msg.channel.send("You don't have a pet selected");
	else if(coins < 100-pet.stat)
		return msg.channel.send("You can't afford to feed your pet!");
	
	
	/* Refill the selected parameter of the pet */
	if(pet.stat < 100)
	{	DB.pool()
			.query( "UPDATE user_profile "+
					"SET coins=" + (coins - (100-pet.stat)) + " "+
					"WHERE uid=" + msg.author.id + ";\n" +
					"UPDATE user_pets SET "+parameter+"=100 "+
					"WHERE uid=" + msg.author.id + " and pid=" + pet.pid)
			.then(res=>
			{	/* Select appropriate confirmation message to the parameter */
				switch(parameter)
				{	case "food" : msg.channel.send("You fed **" + pet.name + "** which cost you **" + (100-pet.stat) + "** "+EMOTE_COIN); break;
					case "clean": msg.channel.send("You gave **" + pet.name + "** a bath which cost you **" + (100-pet.stat) + "** "+EMOTE_COIN); break;
					case "mood" : msg.channel.send("You played with **" + pet.name + "** and **" + (100-pet.stat) + "** "+EMOTE_COIN+" slipped out of your pocket!"); break;
				}			
			})
			.catch(err=>
			{	msg.channel.send("Operation Failed");
				Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to update the pet's stats");
			});
	}
	else
	{	/* Select appropriate error message to the parameter */
		switch(parameter)
			{	case "food" : msg.channel.send("**" + pet.name + "** is already full!"); break;
				case "clean": msg.channel.send("**" + pet.name + "** is already squeaky clean!"); break;
				case "mood" : msg.channel.send("**" + pet.name + "** is bored of playing!"); break;
			}
	}
}

/* Lets the pet fight an enemy to gain xp. */
/* Fighting takes 1 Energy and the pet takes some Damage */
/* If the pet's health hits 0, the pet loses all of its energy */
async function hunt(msg)
{
	/* List of creatures to encounter in each habitat */
	var encounter = [ 	["Fox",		"Bear",		 "Deer",	"Frog",		"Bush", 		"Owl"		],
						["Snowman",	"Wolf",		 "Yeti",	"Penguin",	"Polar Bear",	"Puddle"	],
						["Snake",	"Camel",	 "Goat",	"Lion",		"Tumbleweed",	"Cactus" 	],
						["Beggar",	"Protester", "Rat",		"Student",	"Politician",	"Trash Can"	],
						["Bat",		"Spider",	 "Shadow",	"Rock",		"Centipede", 	"Ghost"		] ];
	
	/* Pre calculate the damage and the encountered creature */
	var dmg = Math.floor(Math.random()*25);
	var enc = Math.floor(Math.random()*6);
	
	/* Get details about the user's pet */
	var pet = await DB.pool()
		.query( "SELECT pid, name, life, energy, habitat, inherited " +
				"FROM user_pets " +
				"INNER JOIN pet_settings ON user_pets.pid=pet_settings.current AND user_pets.uid=pet_settings.uid " +
				"WHERE user_pets.uid=" + msg.author.id)
		.then(res=> {return res.rows[0]})
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed get the user's current pet from pet_settings");
		});
	
	/*  Error checking for no pet or not enough energy */
	if(pet === undefined)
		return msg.channel.send("You don't have a pet selected");
	else if (pet.energy==0)
		return msg.channel.send("**"+pet.name+"** is too tired to do that!");

	var enemy = encounter[pet.habitat-1][enc];
	
	/* Kill the pet if HP hits 0 */
	if(dmg > pet.life)
	{
		DB.pool()
			.query( "UPDATE user_pets "+
					"SET energy=0, life=0 "+
					"WHERE uid=" + msg.author.id + " and pid=" + pet.pid)
			.then(res=> { msg.channel.send("**" + pet.name + "** fainted while fighting a wild **" + enemy + "**"); })
			.catch(err=>
			{	msg.channel.send("Operation Failed");
				Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to update the pet's stats");
			});
	}
	/* Change parameters after defeating the enemy */
	else
	{
		DB.pool()
			.query( "UPDATE user_pets "+
					"SET energy=energy-1, life=life-"+dmg+", attack=attack+2, defense=defense+2 "+
					"WHERE uid=" + msg.author.id + " and pid=" + pet.pid)
			.then(res=> { msg.channel.send("**"+pet.name+"** gained xp from defeating a wild **"+enemy+"**!   *("+(pet.life-dmg)+EMOTE_HEALTH+", "+(pet.energy-1)+EMOTE_ENERGY +" left)*"); })
			.catch(err=>
			{	msg.channel.send("Operation Failed");
				Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to update the pet's stats");
			});
	}
}

/* Lets the pet gain experience through training */
/* Training takes 1 energy and is completely safe */
/* The amount of training can be specified to reduce spam */
async function train(msg, type, amount, updates)
{
	/* Check if the given amount parameter is a valid integer */
	if(amount === undefined || !Number.isInteger(parseInt(amount)))
		amount = 1;

	/* Get details about the user's pet */
	var pet = await DB.pool()
		.query( "SELECT pid, name, energy " +
				"FROM user_pets " +
				"INNER JOIN pet_settings ON user_pets.pid=pet_settings.current AND user_pets.uid=pet_settings.uid " +
				"WHERE user_pets.uid=" + msg.author.id)
		.then(res=> {return res.rows[0]})
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed get the user's current pet from pet_settings");
		});
	
	/*  Error checking for no pet or not enough energy */
	if(pet === undefined)
		return msg.channel.send("You don't have a pet selected");
	else if (pet.energy < amount)
		return msg.channel.send("**"+pet.name+"** is too tired to do that!");
	
	/* Construct the update part of the query based on column and value fields */
	var change = "";
	for(var i=0; i<updates.length-1; i++)
		change+= updates[i].c + "=" + updates[i].c + (updates[i].v < 0 ? "" : "+") + (updates[i].v*amount) + ", ";
	change+= updates[i].c + "=" + updates[i].c + (updates[i].v < 0 ? "" : "+") + (updates[i].v*amount) + " ";
	
	/* Change parameters after the interaction */
	DB.pool()
		.query( "UPDATE user_pets "+
				"SET " + change + " " +
				"WHERE uid=" + msg.author.id + " AND pid=" + pet.pid)
		.then(res=> 
		{	/* Select appropriate message to the interaction */
			switch(type)
			{	case ".beat"  : msg.channel.send("**"+pet.name+"** looks stronger from the strict disciplining you gave! Your Pet also looks sad, I hope you're happy! *("+(pet.energy-amount)+" "+EMOTE_ENERGY+" left)*"); break;
				case ".train" : msg.channel.send("**"+pet.name+"** looks more nimble and strong from the training! *("+(pet.energy-amount)+" "+EMOTE_ENERGY+" left)*"); break;
				case ".walk"  : msg.channel.send("**"+pet.name+"** walks more confidently in the area after the exercise! *("+(pet.energy-amount)+" "+EMOTE_ENERGY+" left)*"); break;
				case ".trick" : msg.channel.send("**"+pet.name+"** learned some incredible stunts! Or just got lucky.. *("+(pet.energy-amount)+" "+EMOTE_ENERGY+" left)*"); break;
			}
		})
		.catch(err=>
		{	msg.channel.send("Operation Failed");
			Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to update the pet's stats");
		});
}

/* Makes the pet search for money at the cost of 1 energy */
/* The amount of search can be specified to reduce spam */
async function search(msg, amount)
{
	/* Check if the given amount parameter is a valid integer */
	if(amount === undefined || !Number.isInteger(parseInt(amount)))
		amount = 1;
	
	/* Get details about the user's pet */
	var pet = await DB.pool()
		.query( "SELECT pid, name, energy " +
				"FROM user_pets " +
				"INNER JOIN pet_settings ON user_pets.pid=pet_settings.current AND user_pets.uid=pet_settings.uid " +
				"WHERE user_pets.uid=" + msg.author.id)
		.then(res=> {return res.rows[0]})
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed get the user's current pet from pet_settings");
		});
	
	/*  Error checking for no pet or not enough energy */
	if(pet === undefined)
		return msg.channel.send("You don't have a pet selected");
	else if (pet.energy < amount)
		return msg.channel.send("**"+pet.name+"** is too tired to do that!");
	
	/* Change parameters after the interaction */
	DB.pool()
		.query( "UPDATE user_pets "+
				"SET energy=energy-"+amount+" " +
				"WHERE uid=" + msg.author.id + " and pid=" + pet.pid + ";\n"+
				"UPDATE user_profile "+
				"SET coins=coins+"+(2*amount)+" "+
				"WHERE uid=" + msg.author.id)
		.then(res=> 
		{	msg.channel.send("**"+pet.name+"** scavenged the area and found "+(2*amount)+EMOTE_COIN+"! *("+(pet.energy-amount)+" "+EMOTE_ENERGY+" left)*");
		})
		.catch(err=>
		{	msg.channel.send("Operation Failed");
			Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to update the pet's stats");
		});
}

/* Heals the pet for 25 health at the cost of 1 energy */
/* The amount of pat can be specified to reduce spam */
async function pat(msg, amount)
{
	/* Check if the given amount parameter is a valid integer */
	if(amount === undefined || !Number.isInteger(parseInt(amount)))
		amount = 1;
	
	/* Get details about the user's pet */
	var pet = await DB.pool()
		.query( "SELECT pid, name, attack, defense, speed, luck, life, inherited, energy " +
				"FROM user_pets " +
				"INNER JOIN pet_settings ON user_pets.pid=pet_settings.current AND user_pets.uid=pet_settings.uid " +
				"WHERE user_pets.uid=" + msg.author.id)
		.then(res=> {return res.rows[0]})
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed get the user's current pet from pet_settings");
		});
	
	/*  Error checking for no pet or not enough energy */
	if(pet === undefined)
		return msg.channel.send("You don't have a pet selected");
	else if (pet.energy < amount)
		return msg.channel.send("**"+pet.name+"** is too tired to do that!");
	
	var stats   = petData(pet.attack, pet.defense, pet.speed, pet.luck, pet.life, pet.inherited);
	var newlife = (pet.life + 25 * amount);
	if(newlife > stats.maxhp)
		newlife = stats.maxhp;
	
	/* Change parameters after the interaction */
	DB.pool()
		.query( "UPDATE user_pets "+
				"SET energy=energy-"+amount+", life="+newlife+" " +
				"WHERE uid=" + msg.author.id + " and pid=" + pet.pid)
		.then(res=> 
		{	msg.channel.send("**"+pet.name+"** looks happier and trusts you more after the headpats **("+newlife+"/"+stats.maxhp + EMOTE_HEALTH + ")**!  *("+(pet.energy-amount)+" "+EMOTE_ENERGY+" left)*");
		})
		.catch(err=>
		{	msg.channel.send("Operation Failed");
			Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to update the pet's stats");
		});
}

/* Challenges another user with a pet to fight for 10 energy*/
/* If the user wins the fight, they switch rankings */
async function fight(msg)
{
	// Picking the target for the profile, either the user or the mentioned user
	var user  = msg.author;
	var enemy = msg.mentions.users.array()[0];
	
	if(enemy === undefined || user.id == enemy.id)
		return msg.channel.send("You need to mention someone with a pet to fight");
	
	/* Select the pets of the two users */
	var user_c = DB.pool()
		.query( "SELECT user_pets.pid, energy, attack, defense, speed, luck, inherited, name, rank " +
				"FROM public.pet_settings " +
				"INNER JOIN user_pets ON pet_settings.uid=user_pets.uid " +
				"WHERE pet_settings.uid="+user.id+" AND pet_settings.current=user_pets.pid ")
		.then(res=> {return res.rows[0];})
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed get the user's current pet from pet_settings");
		});
		
	var user_m = DB.pool()
		.query( "SELECT user_pets.pid, energy, attack, defense, speed, luck, inherited, name, rank " +
				"FROM public.pet_settings " +
				"INNER JOIN user_pets ON pet_settings.uid=user_pets.uid " +
				"WHERE pet_settings.uid="+user.id+" AND pet_settings.current=user_pets.pid ")
		.then(res=> {return res.rows[0];})
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed get the user's main pet from pet_settings");
		});
		
	var enemy_c = DB.pool()
		.query( "SELECT user_pets.pid, energy, attack, defense, speed, luck, inherited, name, rank " +
				"FROM public.pet_settings " +
				"INNER JOIN user_pets ON pet_settings.uid=user_pets.uid " +
				"WHERE pet_settings.uid="+enemy.id+" AND pet_settings.current=user_pets.pid ")
		.then(res=> {return res.rows[0];})
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed get the enemy's current pet from pet_settings");
		});
		
	var enemy_m = DB.pool()
		.query( "SELECT user_pets.pid, energy, attack, defense, speed, luck, inherited, name, rank " +
				"FROM public.pet_settings " +
				"INNER JOIN user_pets ON pet_settings.uid=user_pets.uid " +
				"WHERE pet_settings.uid="+enemy.id+" AND pet_settings.current=user_pets.pid ")
		.then(res=> {return res.rows[0];})
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed get the enemy's main pet from pet_settings");
		});
	
	user_c  = await Promise.resolve(user_c);
	user_m  = await Promise.resolve(user_m);
	enemy_c = await Promise.resolve(enemy_c);
	enemy_m = await Promise.resolve(enemy_m);
	
	userPet  = user_m  === undefined ? (user_c  === undefined ? null : user_c)  : user_m;
	enemyPet = enemy_m === undefined ? (enemy_c === undefined ? null : enemy_c) : enemy_m;
	
	if(enemyPet === null || userPet === null)
		return msg.channel.send("You need to mention someone with a pet to fight");
	else if(userPet.energy < 10)
		return msg.channel.send("Your pet is too tired to fight");

	/* Get the stats of the pets */
	userStats  = petData(userPet.attack,  userPet.defense,  userPet.speed,  userPet.luck,  0, userPet.inherited);
	enemyStats = petData(enemyPet.attack, enemyPet.defense, enemyPet.speed, enemyPet.luck, 0, enemyPet.inherited);
	
	userStats.action  = 0;
	enemyStats.action = 0;
	userStats.hp  = userStats.maxhp;
	enemyStats.hp = userStats.maxhp;
	
	/* Simulate the fight between the pets */
	var count;
	for (count = 0; userStats.hp>0 && enemyStats.hp>0 && count<1000; count++)
	{
		userStats.action  += userStats.s;
		enemyStats.action += enemyStats.s;
		
		if(userStats.action>=100)
		{	var dmg = Math.floor((userStats.a * ((Math.random()*100) < userStats.l ? 1.5 : 1) - (enemyStats.d/2)) * ((Math.random()*100) < enemyStats.l ? 0.5 : 1));
			enemyStats.hp-=(dmg > 0 ? dmg : 0);
			userStats.action-=100;
		}
		
		if(enemyStats.action>=100)
		{	var dmg = Math.floor((enemyStats.a * ((Math.random()*100) < enemyStats.l ? 1.5 : 1) - (userStats.d/2)) * ((Math.random()*100) < userStats.l ? 0.5 : 1));
			userStats.hp -= (dmg > 0 ? dmg : 0);
			enemyStats.action-=100;
		}
	}
	
	userStats.hp  = userStats.hp  < 0 ? 0 : Math.floor(userStats.hp);
	enemyStats.hp = enemyStats.hp < 0 ? 0 : Math.floor(enemyStats.hp);
	message  = user.username  + "'s **" + userPet.name  + "** is left with **" + userStats.hp  + "/" + userStats.maxhp  + "**" + EMOTE_HEALTH + "\n";
	message += enemy.username + "'s **" + enemyPet.name + "** is left with **" + enemyStats.hp + "/" + enemyStats.maxhp + "**" + EMOTE_HEALTH + "\n";
	
	/* Make changes in the Database to reflect the outcome of the fight */
	if(count == 1000)
	{	
		DB.pool()
			.query( "UPDATE user_pets " +
					"SET energy=energy-10 " +
					"WHERE uid=" + user.id + " AND pid=" + userPet.pid)
			.then(res=> 
			{	message += "__*It's a draw!*__\n";
				msg.channel.send(message);
			})
			.catch(err=>
			{	msg.channel.send("Operation Failed");	
				Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to update the user's pet");
			});
	}
	else if( userStats.hp == 0)
	{	
		DB.pool()
			.query( "UPDATE user_pets " +
					"SET energy=energy-10 " +
					"WHERE uid=" + user.id + " AND pid=" + userPet.pid)
			.then(res=> 
			{	message += "__*" + enemy.username + " Won!*__\n";
				msg.channel.send(message);
			})
			.catch(err=>
			{	msg.channel.send("Operation Failed");	
				Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to update the user's pet");
			});
	}
	else
	{
		// Pick new ranking
		var uRank = userPet.rank;
		var eRank = enemyPet.rank;
		if(uRank > eRank)
		{	var tmp = uRank;
			uRank = eRank;
			eRank = tmp;
		}

		DB.pool()
			.query( "UPDATE user_pets " +
					"SET energy=energy-10 " +
					"WHERE uid=" + user.id + " AND pid=" + userPet.pid+";\n" +
					"UPDATE pet_settings " +
					"SET rank=" + uRank + " " +
					"WHERE uid=" + user.id + ";\n" +
					"UPDATE pet_settings " +
					"SET rank=" + eRank + " " +
					"WHERE uid=" + enemy.id + ";\n")
			.then(res=> 
			{	message += "__*" + user.username + " Won!*__\n";
				msg.channel.send(message);
			})
			.catch(err=>
			{	msg.channel.send("Operation Failed");	
				Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to update the user's pet");
			});
	}
	
	return;
}

/* Sends a message with the overall pet rankings */
async function ranking(msg)
{
	var ranks = await DB.pool()
		.query(	"SELECT users.uid, users.username, users.nickname, rank, cupets.name AS cname, mupets.name AS mname, cpets.emote as cemote, mpets.emote as memote " + 
				"FROM pet_settings " +
				"INNER JOIN users ON users.uid= pet_settings.uid " +
				"INNER JOIN user_pets AS cupets ON pet_settings.current=cupets.pid  AND pet_settings.uid=cupets.uid " +
				"LEFT JOIN user_pets AS mupets ON pet_settings.main=mupets.pid  AND pet_settings.uid=mupets.uid " +
				"INNER JOIN pets AS cpets ON pet_settings.current=cpets.pid "+
				"LEFT JOIN pets AS mpets ON pet_settings.main=mpets.pid "+
				"ORDER BY rank ASC")
		.catch(err=>
			{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to get the pet rankings from the database");
			});
		
	msg.channel.send(Embeds.rankingOfPets(ranks.rows, msg.author));
	return;	
}

module.exports = {
	
	commands: [	".petshow", ".showpet", ".pets", ".setpet", ".lockpet", ".habitats", ".sethabitat", ".namepet", 
				".feed", ".clean", ".play", ".hunt", ".beat", ".train", ".walk", ".trick", ".search", ".pat", ".fight", ".petrank"],

	commandManager: function(msg, ltokens, utokens)
	{
		switch(ltokens[0])
		{
			case ".petshow"     : 
			case ".showpet"     : pet(msg); break;
			case ".namepet"     : namePet(msg, utokens[1]); break;
			case ".pets"        : 
			case ".petlist"     : listPets(msg); break;
			case ".setpet"      : setPet(msg, ltokens[1], "current"); break;
			case ".lockpet"     : setPet(msg, ltokens[1], "main"); break;
			case ".habitats"    : 
			case ".habitatlist" : listHabitats(msg); break;
			case ".sethabitat"  : setHabitat(msg, ltokens[1]); break;
			
			case ".feed"   : care(msg, "food"); break;
			case ".clean"  : care(msg, "clean"); break;
			case ".play"   : care(msg, "mood"); break;
			case ".hunt"   : hunt(msg); break;
			case ".beat"   : train(msg, ".beat",  ltokens[1], [{c:"energy", v:-1}, {c:"attack", v:3}]); break;
			case ".train"  : train(msg, ".train", ltokens[1], [{c:"energy", v:-1}, {c:"attack", v:1}, {c:"speed",   v:1}]); break;
			case ".walk"   : train(msg, ".walk",  ltokens[1], [{c:"energy", v:-1}, {c:"speed",  v:1}, {c:"defense", v:1}]); break;
			case ".trick"  : train(msg, ".trick", ltokens[1], [{c:"energy", v:-1}, {c:"speed",  v:1}, {c:"luck",    v:1}]); break;
			case ".search" : search(msg, ltokens[1]); break;
			case ".pat"    : pat   (msg, ltokens[1]); break;
			case ".fight"  : fight(msg); break;
			case ".petrank": ranking(msg); break;
		}
	},

	/* Drains the Food/Clean/Mood stats of all the pets by 1 */
	drainStats: async function()
	{
		DB.pool()
			.query(	"UPDATE user_pets " +
					"SET food=food-1 "+
					"WHERE food>0;\n" + 
					"UPDATE user_pets " +
					"SET clean=clean-1 "+
					"WHERE clean>0;\n" + 
					"UPDATE user_pets " +
					"SET mood=mood-1 "+
					"WHERE mood>0;\n")
			.catch(err=>
			{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to Drain Pet Stats");
			});
	},

	/* Increases the Energy of all pets with Food/Clean/Mood stats above 0 */
	increaseEnergy: async function()
	{
		DB.pool()
			.query(	"UPDATE user_pets " +
					"SET energy=energy+1 "+
					"WHERE food>0 AND clean>0 AND mood>0 AND energy<100")
			
			.catch(err=>
			{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to Increase Pet Energy");
			});
	}
}