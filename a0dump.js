#!/usr/bin/node

const request = require('request');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp').sync;
const program = require('./lib/cli');
const winston = require('./lib/logger');
const authenticate = require('./lib/auth');
//----------------------------------------------------------------------------------------------------------------------

program
.option('-o,--output_dir <output dir>', 'The directory where the config will be written. See README and online for more info.')
.parse(process.argv);

if (!program.output_dir) {
	program.printHelpAndExit('Must set the output directory');
}

const config = require( path.isAbsolute(program.config_file) ? program.config_file : path.join(process.cwd(), program.config_file) );
const DIR = path.isAbsolute(program.output_dir) ? program.output_dir : path.join(process.cwd(), program.output_dir);
var TOKEN = null;

mkdirp(DIR);
//----------------------------------------------------------------------------------------------------------------------

function getjson(entityName) {
	return new Promise((resolve, reject) => {
		request({
			url: 'https://'+config.AUTH0_DOMAIN+'/api/v2/'+entityName,
			headers: {
				'Authorization': 'Bearer '+TOKEN,
				'Cache-Control': 'no-cache',
			}
		},
		function (error, response, body) {
			if (error) {
				reject(error);
			}
			else if (response.statusCode != 200) {
				reject(new Error("HTTP code : " + response.statusCode + "; " + body));
			}
			else {
				winston.info("Got "+entityName);
				var json = JSON.parse(body);
				resolve(json);
			}
		});
	})
}
//----------------------------------------------------------------------------------------------------------------------

function writeFiles(dir) {
	mkdirp(path.join(DIR,dir));
	return function(json) {
		for (let item of json) {
			item = Object.keys(item).sort().reduce((r, k) => {r[k] = item[k]; return r}, {});
			var name = item.name;
			var filePath = path.join(DIR, dir, name+".json");
			fs.writeFileSync(filePath, JSON.stringify(item,null,'\t'));
			winston.info(" - Wrote", dir, name+".json");
		}
	}
}

function writeConnections() {
	return function(json) {
		mkdirp(path.join(DIR,'database-connections'));
		for (let item of json) {
			if (item.options.customScripts && Object.keys(item.options.customScripts).length > 0) {
				var name = item.name;
				mkdirp(path.join(DIR,'database-connections',name));
				
				[
					'get_user',
					'create',
					'verify',
					'login',
					'change_password',
					'delete',
				].forEach((file) => {
					if (item.options.customScripts[file]) {
						var fpath = path.join(DIR,'database-connections',name, file+".js");
						fs.writeFileSync(fpath, item.options.customScripts[file]);
						winston.info(" - Wrote", fpath);
					}
				});
				delete item.options.customScripts;
			}
		}
		//writeFiles('connections')(json);
	}
}
//----------------------------------------------------------------------------------------------------------------------

//FIXME Pages dump not implemented

winston.info("Dumping configuration to "+DIR);
authenticate(config)
.then((token) => {TOKEN = token})
.then(() => {
	var getConnections = getjson('connections').then(writeConnections());
	var getClients = getjson('clients')
	.then((clients) => clients.filter((c) => c.name != "All Applications"))
	.then((clients) => clients.filter((c) => c.client_id != config.AUTH0_CLIENT_ID))
	.then(writeFiles('clients'));
	var getRules = getjson('rules').then(writeFiles('rules'));
	
	return Promise.all([getConnections, getClients, getRules])
})
.catch(e => {
	winston.error(e);
	process.exit(1);
});