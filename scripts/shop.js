const Commons = require('./commons.js');
const Embeds  = require('./embeds.js');
const DB      = require('./database.js');
const fs      = require('fs');

const { Client, RichEmbed,  MessageEmbed} = require('discord.js');
const { createCanvas, loadImage, Image } = require('canvas');

/* Unlocks an item for the user, including titles and badges */
async function buy(msg, option, field, table, cost, type)
{	
	/* Check if the item is already unlocked for the user */
	var unlocked = await DB.pool()
		.query(	"SELECT * "+
				"FROM "+table+" "+
				"WHERE uid="+msg.author.id+" and "+field+"="+option)
		.then(res => { return res.rows.length > 0; })
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to check if "+option+" is unlocked for " + msg.author.username);
		});
	
	if(unlocked)
	{	msg.channel.send("You already own this");
		return;
	}
	
	/* Check if the user has enough currency to buy the item */
	var currency = await DB.pool()
		.query(	"SELECT "+type+" "+
				"FROM user_profile "+
				"WHERE uid="+msg.author.id)
		.then(res => { return (type == "coins" ? res.rows[0].coins : res.rows[0].gems); })
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to check if " + msg.author.username + " can afford " + option);
		});
	
	if(currency > cost)
	{	/* Insert the item into the table of unlocks */
		await DB.pool()
			.query( "INSERT INTO "+table+" (uid, "+field+") "+
					"VALUES("+msg.author.id+", "+option+");\n" +
					"UPDATE user_profile "+
					"SET "+type+"="+(currency-cost)+" "+
					"WHERE uid="+msg.author.id)
			.then( res =>
			{	msg.channel.send("Purchase Successful");
			})
			.catch(err=>
			{	msg.channel.send("Transaction Failed!");
				Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to add item "+option+" for " + msg.author.username);
			});
	}
	else
		msg.channel.send("You can't afford this");	
}

/* Changes the  color of the user's name or title on the Profile Card*/
async function buyColor(msg, color, field, cost, type)
{
	/* Checking if the color argument exists in the right format */
	if(color === undefined || color === null || color.length === undefined)
	{	msg.channel.send("Not a valid color input");
		return;
	}
	
	/* Check if the color provided is a valid color Hexadecimal */
	var cint = parseInt(color, 16);	
	for(var i=0; i<6;i++)
		if(color.length!=6 || !(color[i] >= '0' && color[i] <= '9' || color[i] >= 'a' && color[i] <= 'f'))
		{	msg.channel.send("Not a valid color input");
			return;
		}
		
	/* Check if the user has enough currency to buy the item */
	var currency = await DB.pool()
		.query(	"SELECT "+type+" "+
				"FROM user_profile "+
				"WHERE uid="+msg.author.id)
		.then(res => { return (type == "coins" ? res.rows[0].coins : res.rows[0].gems); })
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to check if " + msg.author.username + " can afford a new color");
		});
	
	if(currency > cost)
	{	/* Update the profile record in the Database */
		await DB.pool()
			.query(	"UPDATE user_profile "+
					"SET "+type+"="+(currency-cost)+", "+field+"="+cint+" "+
					"WHERE uid="+msg.author.id)
			.then( res =>
			{	msg.channel.send("Purchase Successful");
			})
			.catch(err=>
			{	msg.channel.send("Transaction Failed!");
				Commons.errlog(new Error().stack+ Commons.pgerr(err), 
				"Failed to change title/name color for " + msg.author.username);
			});
	}
	else
		msg.channel.send("You can't afford this");
}
	
/* Changes the background image of the Profile Card */
async function buyBG(msg, URL, cost, type)
{
	/* Checking if the URL argument exists in the right format */
	if(URL === undefined || URL === null || URL.length === undefined)
	{	msg.channel.send("Failed to load the image!");
		return;
	}
	
	/* Load the image from the URL */
	var img = await Commons.loadImage(Commons.esc(URL))
		.catch(e =>
		{	msg.channel.send("Failed to load the image!");
			console.error(e.stack);
		});
	
	if(img === undefined) {return;}
		
	/* Check if the user has enough currency to buy the item */
	var currency = await DB.pool()
		.query(	"SELECT "+type+" "+
				"FROM user_profile "+
				"WHERE uid="+msg.author.id)
		.then(res => { return (type == "coins" ? res.rows[0].coins : res.rows[0].gems); })
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to check if " + msg.author.username + " can afford a new background");
		});
	
	if(currency > cost)
	{	
		/* Cache the image on the disk */
		const bgimage = createCanvas(800, 400)
		const ctx = bgimage.getContext('2d');
		
		ctx.drawImage(img, 0,0, 800, 400);
		Commons.saveImage(bgimage.createPNGStream(), 'images/backgrounds/'+msg.author.id+'.png')
		.then(res=>
		{	/* Update the profile record in the Database */
			DB.pool()
				.query(	"UPDATE user_profile "+
						"SET "+type+"="+(currency-cost)+", background='"+Commons.esc(URL)+"' "+
						"WHERE uid="+msg.author.id)
				.then( res =>
				{	msg.channel.send("Purchase Successful");
				})
				.catch(err=>
				{	msg.channel.send("Transaction Failed!");
					Commons.errlog(new Error().stack+ Commons.pgerr(err), 
					"Failed to change background for " + msg.author.username);
				});
		})
		.catch( e=>{
			console.error(e.stack);
			msg.channel.send("Transaction Failed");
		})
	}
	else
		msg.channel.send("You can't afford this");
}

async function buyPet(msg, option, cost, type)
{
	/* Check if the item is already unlocked for the user */
	var unlocked = await DB.pool()
		.query(	"SELECT * "+
				"FROM user_pets "+
				"WHERE uid="+msg.author.id+" and pid="+option)
		.then(res => { return res.rows.length > 0; })
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to check if "+option+" is unlocked for " + msg.author.username);
		});
	
	if(unlocked)
	{	msg.channel.send("You already own this pet");
		return;
	}
	
	/* Fetch the Pet's details */
	var pet = await DB.pool()
		.query(	"SELECT * "+
				"FROM pets "+
				"WHERE pid="+option)
		.then(res => { return res.rows[0]; })
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to get pet details about "+ option);
		});	
	
	/* Check if the user has enough currency to buy the item */
	var currency = DB.pool()
		.query(	"SELECT "+type+" "+
				"FROM user_profile "+
				"WHERE uid="+msg.author.id)
		.then(res => { return (type == "coins" ? res.rows[0].coins : res.rows[0].gems); })
		.catch(err=>
		{	Commons.errlog(new Error().stack+ Commons.pgerr(err), 
			"Failed to check if " + msg.author.username + " can afford a "+option);
		});
	
	currency = await Promise.resolve(currency);
	pet = await Promise.resolve(pet);
	
	if(currency > cost)
	{	/* Insert the item into the table of unlocks */
		var inheritedXP = pet.attack + pet.defense + pet.speed + pet.luck;
		await DB.pool()
			.query(	"INSERT INTO user_pets (uid, pid, attack, defense, speed, luck, inherited, name) "+
					"VALUES("+msg.author.id+", "+option+", "+pet.attack+", "+pet.defense+", "+pet.speed+", "+pet.luck+", "+inheritedXP+", '"+pet.name+"');\n "+
					"UPDATE user_profile "+
					"SET "+type+"="+(currency-cost)+" "+
					"WHERE uid="+msg.author.id)
			.then( res =>
			{	msg.channel.send("Purchase Successful");
			})
			.catch(err=>
				{	msg.channel.send("Transaction Failed!");
					Commons.errlog(new Error().stack+ Commons.pgerr(err), 
					"Failed to add "+option+" for " + msg.author.username);
				});
	}
	else
		msg.channel.send("You can't afford this");
}
	
module.exports = {

	commands: [".buy", ".shop"],

	commandManager: function(msg, ltokens, utokens)
	{
		/* Buying section of the Shop Manager */
		if(ltokens[0] == ".buy")
		{
			switch(ltokens[1])
			{	case 'b1':		buy(msg, 7, 'bid', 'user_badges', 9999, 'coins'); 	break;
				case 'b2':		buy(msg, 8, 'bid', 'user_badges', 300, 'gems'); 	break;
				case 't1':		buy(msg, 3,'tid', 'user_titles', 200, 'coins'); 	break;
				case 't2':		buy(msg, 4,'tid', 'user_titles', 200, 'coins'); 	break;
				case 't3':		buy(msg, 5,'tid', 'user_titles', 100, 'coins'); 	break;
				case 't4':		buy(msg, 6,'tid', 'user_titles', 100, 'coins'); 	break;
				case 't5':		buy(msg, 7,'tid', 'user_titles', 100, 'coins'); 	break;
				case 't6':		buy(msg, 8,'tid', 'user_titles', 200, 'coins'); 	break;
				case 't7':		buy(msg, 9,'tid', 'user_titles', 500, 'coins'); 	break;
				case 't8':		buy(msg, 10,'tid', 'user_titles', 50, 'gems'); 		break;
				case 'snow':	buy(msg, 2,'hid', 'user_habitats', 500, 'coins'); 	break;
				case 'desert':	buy(msg, 3,'hid', 'user_habitats', 500, 'coins'); 	break;
				case 'city':	buy(msg, 4,'hid', 'user_habitats', 500, 'coins'); 	break;
				case 'cave':	buy(msg, 5,'hid', 'user_habitats', 500, 'coins'); 	break;
				case 'turtle':	buyPet(msg, 1, 1000, 'coins'); break;
				case 'llama':	buyPet(msg, 2, 1000, 'coins'); break;
				case 'duck':	buyPet(msg, 3, 1000, 'coins'); break;
				case 'cat':		buyPet(msg, 4, 1000, 'coins'); break;
				case 'rock':	buyPet(msg, 5, 1000, 'coins'); break;
				case 'plant':	buyPet(msg, 6, 1000, 'coins'); break;
				case 'dog':		buyPet(msg, 7, 1000, 'coins'); break;
				case 'nc':		buyColor(msg, ltokens[2], 'namecolor', 10, 'coins'); break;
				case 'tc':		buyColor(msg, ltokens[2], 'titlecolor', 10, 'coins'); break;
				case 'bg':		buyBG(msg, utokens[2], 1000, 'coins'); break;
			}
		}
		
		/* Shop Display section of the Shop Manager */
		if(ltokens[0] == ".shop")
		{
			switch(ltokens[1])
			{	case '2':
				case 'titles':	msg.channel.send(Embeds.shop2()); break;
				case '3':
				case 'pet':	
				case 'pets':	msg.channel.send(Embeds.shop3()); break;
				case '1':
				case 'profile':	
				default:		msg.channel.send(Embeds.shop1());
			}
		}
	}
}