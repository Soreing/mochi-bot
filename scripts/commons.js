
const { Image } = require('canvas');
const https = require('https');
const fs    = require('fs');
const { spawn } = require('child_process');

function occurence(string, val)
{
	var count=0;
	for(var i=0 ; i<string.length; i++)
		if(string[i]==val)
			count++;
	return count;
}

module.exports = {
	
	/* Constructs a verbose string from a postgres error */
	pgerr: function(err)
	{
		return err.stack + "\n{\n" +
		"  length:       " + err.length + ",\n" +
		"  severity:     " + err.severity + ",\n" +
		"  code:         " + err.code + ",\n" +
		"  detail:       " + err.detail + ",\n" +
		"  hint:         " + err.hint + ",\n" +
		"  position:     " + err.position + ",\n" +
		"  intrPosition: " + err.internalPosition + ",\n" +
		"  intrQuery:    " + err.internalQuery + ",\n" +
		"  where:        " + err.where + ",\n" +
		"  schema:       " + err.schema + ",\n" +
		"  table:        " + err.table + ",\n" +
		"  column:       " + err.column + ",\n" +
		"  dataType:     " + err.dataType + ",\n" +
		"  constraint:   " + err.constraint + ",\n" +
		"  file:         " + err.file + ",\n" +
		"  line:         " + err.line + ",\n" +
		"  routine:      " + err.routine + "\n}";
	},
	
	/* Saves an error log to a file */
	errlog: function(err, msg)
	{
		var mexp = module.exports;
		var t    = new Date(Date.now());
			
		/* Construct log file name */
		var name =	t.getFullYear() + '.' + mexp.padz(t.getMonth()+1, 2) + '.' + mexp.padz(t.getDate(), 2) + '_' +
					mexp.padz(t.getHours(), 2)  + '.' + mexp.padz(t.getMinutes(), 2) + '.' + mexp.padz(t.getSeconds(), 2) + '_' + 
					mexp.padz(t.getMilliseconds(), 4);
			
		/* Display error on the terminal */
		console.log("\x1b[31m" + mexp.timeStamp() + " " + msg + "\x1b[0m");
		
		/* Save error log file */
		fs.writeFile("error-logs/" + name + ".txt", err, function(err) 
		{	if(err) 
				throw err;
		}); 
		
	},
	
	/* Repeats a certain string "num" times */
	repeat: function(str, num)
	{	 return (num <= 0 ? "" : str.repeat(num));
	},
	
	/* pads a value with zeroes to be the right size */
	padz: function(str, size)
	{
		var mexp = module.exports;
		return mexp.repeat("0", size-(str+"").length) + str;
	},
	
	
	count: function(string, val)
	{
		var cnt=0;
		for (var i=0; -1 != (i=string.indexOf(val, i+1)); cnt++);
		
		return cnt;
	},
	
	noWhitespace: function(string)
	{
		var cnt=0;
		for (var i=0; i<string.length; i++)
			if(string[i]!= ' ' && string[i]!= '\t')
				cnt++;
		
		return cnt;
	},
	
	codeTest: function(content)
	{
		var lcontent = content.toLowerCase();
		var lines =  lcontent.split("\n");
		
		var b1  = (lcontent.indexOf("{") != -1);
		var b2  = (lcontent.indexOf("}") != -1);
		var br1  = (lcontent.indexOf("(") != -1);
		var br2  = (lcontent.indexOf(")") != -1);
		var nls = occurence(lcontent, '\n');
		
		
		var braces    = ((b1 && b2) ? 2 : ((b1 || b2) ? 1.5 : 0));
		var brackets   = ((br1 && br2) ? 0.5 : ((br1 || br2) ? 0.25 : 0));
		braces+= brackets;
		
		var newline   = (nls > 5) ? ((nls > 15) ? 2 : 0.5) : 0;
		var tabbing   = (lcontent.indexOf("    ") != -1 || lcontent.indexOf("\t") != -1) ? 0.5 : 0;
		var sql       = (lcontent.indexOf("select") != -1 && lcontent.indexOf("from") != -1 && lcontent.indexOf("where") != -1) ? 3 : 0;
		var comment   = (lcontent.indexOf("//") != -1 || lcontent.indexOf("/*") != -1 || lcontent.indexOf("<!--") != -1) ? 0.5 : 0;
		var blocks    = (lcontent.indexOf("```") != -1) ? 2 : 0;
		
		var sc_count = 0;
		var sc_end   = false;
		for(var i=0; i<lines.length; i++)
		{	var idx = lines[i].indexOf(";");
			if(idx != -1)
				sc_count++;
			if(idx == lines[i].length-1)
				sc_end=true;
		}
		
		var semicolon = 0;
		if( sc_count/lines.length >= 0.1)
			semicolon=0.5;
		if( sc_count/lines.length >= 0.2)
			semicolon=1.5;
		if(sc_end)
			semicolon+=2;
		
		var control   = 0
		if(content.indexOf("for(") != -1)   control += 0.5;
		if(content.indexOf("if(") != -1)    control += 0.5;
		if(content.indexOf("while(") != -1) control += 0.5;
		
		var operators = 0;
		if(content.indexOf("=") != -1)  operators += 0.1;
		if(content.indexOf("+") != -1)  operators += 0.1;
		if(content.indexOf("-") != -1)  operators += 0.1;
		if(content.indexOf(".") != -1) operators += 0.1;
		if(content.indexOf("::") != -1) operators += 0.2;
		if(content.indexOf("!=") != -1) operators += 0.3;
		if(content.indexOf("&&") != -1) operators += 0.3;
		if(content.indexOf("||") != -1) operators += 0.3;
		if(content.indexOf("=>") != -1) operators += 0.3;
		if(content.indexOf("<html>") != -1) operators += 0.5;
		
		var datatype = 0;
		if(content.indexOf("var ") != -1)  datatype += 0.1;
		if(content.indexOf("int ") != -1)  datatype += 0.1;
		if(content.indexOf("float ") != -1)  datatype += 0.1;
		if(content.indexOf("double ") != -1) datatype += 0.1;
		if(content.indexOf("bool ") != -1) datatype += 0.1;
		if(content.indexOf("boolean ") != -1) datatype += 0.1;
		if(content.indexOf("char ") != -1) datatype += 0.1;
		if(content.indexOf("static ") != -1) datatype += 0.1;
		if(content.indexOf("public ") != -1) datatype += 0.1;
		if(content.indexOf("private ") != -1) datatype += 0.1;
		
		return (braces + semicolon + newline + tabbing + sql + comment + blocks + control + operators);
	},
	
	makeid: function makeid() 
	{
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		var text = "";

		for (var i = 0; i < 5; i++)
			text += possible.charAt(Math.floor(Math.random() * possible.length));

		return text;
	},
	
	loadWebP: function loadWebP(src)
	{
		return new Promise( function(resolve,reject) 
		{	
			/* Make a random ID for the temp file and open a file stream */
			const tmpid   = module.exports.makeid();
			const file    = fs.createWriteStream("webp-converter/"+tmpid+".webp");
			
			/* Request the file via the src address using HTTPS.get */
			const request = https.get(src, function(response) 
			{
				/* Once the file downloaded, save it to a file */
				response.pipe(file);
				
				file.on('error', function()	{ reject(e); });
				file.on('finish', function()
				{ 
					/* Start the webp decoder with the temporary filenames */
					//const decoder = spawn("pwd", []);
					const decoder = spawn("webp-converter/dwebp", ["webp-converter/"+tmpid+".webp", "-o", "webp-converter/"+tmpid+".png"]);
					decoder.on('close', code =>
					{
						/* If the conversion was successful, read the .PNG from disk */
						if(code ==0)
						{
							var img = new Image();
							img.onload = function()
							{ 	/* Once the image is loaded, delete the temporary files */
								fs.unlink("webp-converter/"+tmpid+".webp", (err) => { if (err) throw err; });
								fs.unlink("webp-converter/"+tmpid+".png", (err) => { if (err) throw err; });
								resolve(img);
							};
							
	/* On any error, reject the promise and clean up! */
	
							img.onerror = function(e)	{ reject(e);	};
							img.src = "webp-converter/"+tmpid+".png";
						}
						else
						{	fs.unlink("webp-converter/"+tmpid+".webm", (err) => { if (err) throw err; });
							reject("dwebp.exe error code:" +code);
						}
					});
				})
				file.on('error', function()	{ reject(e); });
			});
			request.on("error", err => { reject(err); });
		});
	},
	
	// Escapes a string sequence to be safe for SQL Queries
	// Doubles up ' and " characters
	esc: function esc(str)
	{	
		columns = ['uid','namecolor','title','titlecolor','mediaxp','generalxp','botsxp','academicxp','coins','gems','pets','name','nickname','background','daily','pid','food','clean','energy','mood','attack','defense','speed','life','name','habitat'];
		if (columns.includes(str))
		return null;
		
		var nstr = "";
	
		for(var i=0; i<str.length; i++)
			nstr+= (str[i] == '\'' || str[i] == '"' ? str[i] + str[i] : str[i]);
	
		return nstr;
	},
	
	// Returns a timestamp in the format "[MM/DD/YYYY hh:mm:ss]"
	timeStamp: function timeStamp(time)
	{
		var now = (time === undefined ? new Date() : time);
		return "["+(now.getMonth()+1)+'/'+now.getDate()+'/'+now.getFullYear()+" " +now.getHours()+':'+ (now.getMinutes() < 10 ? '0'+ now.getMinutes() : now.getMinutes()) + "]";
	},
	
	timeStamp_file: function timeStamp(time)
	{
		var now = (time === undefined ? new Date() : time);
		return (now.getMonth()+1)+'-'+now.getDate()+'-'+now.getFullYear()+"_" +now.getHours()+'.'+ (now.getMinutes() < 10 ? '0'+ now.getMinutes() : now.getMinutes());
	},
	
	// Returns a promise to an image being loaded
	loadImage: async function loadImage(src)
	{	
		if(src.substr(src.length-4) == "webp")
			return module.exports.loadWebP(src);
		else	
			return new Promise( function(resolve,reject) 
			{	
				var img = new Image();
				img.onload = function()		{ resolve(img);	};
				img.onerror = function(e)	{ reject(e);	};
				img.src = src
			});
	},
	
	// Returns a promise to an image being loaded
	saveImage: function loadImage(resource, path)
	{
		return new Promise( function(resolve,reject) 
		{
			var out = fs.createWriteStream(path);
			out.on('finish', function()	{ resolve(true);})
			out.on('error', function(e)	{ reject(e);	})
			resource.pipe(out);
		});
	},
	
	saveToFile: function saveToFile(path, text)
	{
		fs.writeFile(path, text, function(err) 
		{	if(err) 
				throw err;
		}); 
	},
	
	colorHex: function colorHex(val)
	{
		var str = val.toString(16);
		while(str.length < 6)
			str = '0' + str;
		return '#' + str;
	}
}