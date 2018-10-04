const chai = require('chai');
const child_process = require('child_process');
const expect = chai.expect;
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf').sync;
chai.use(require('chai-fs'));
//----------------------------------------------------------------------------------------------------------------------

const EXPORTS = __dirname+'/exports';
const CREDENTIALS = __dirname+'/a0deploy_config.json';
const WRONGCREDENTIALS = __dirname+'/a0deploy_config_wrong.json';
const SECRET = 'your_secret';

function a0dump(exportSubDir = 'default', credentials = CREDENTIALS, secret) {
	var args = [__dirname+'/../a0dump.js'];
	if (credentials) {
		args.push('-c');
		args.push(credentials);
	}
	if (exportSubDir) {
		args.push('-o');
		args.push(path.join(EXPORTS, exportSubDir));
	}
	if (secret) {
		args.push('-x');
		args.push(secret);
	}
	return child_process.spawnSync('node', args);
}
function a0deploy(importSubDir = 'default', credentials = CREDENTIALS) {
	var args = [];
	if (credentials) {
		args.push('-c');
		args.push(credentials);
	}
	if (importSubDir) {
		args.push('-i');
		args.push(path.join(EXPORTS, importSubDir));
	}
	
	return child_process.spawnSync(path.join(__dirname,'..','node_modules','.bin','a0deploy'), args);
}

describe('auth0-dump-config', function() {
	//Create the credentials file
	if (fs.existsSync(CREDENTIALS)) {
		rimraf(CREDENTIALS);
	}
	
	var credentials = {
		AUTH0_DOMAIN: 'auth0-import-export-config.eu.auth0.com',
		AUTH0_CLIENT_ID: 'ML1P2J8WCSwoqyMbXxoAAYzhsNwvW3uV',
		AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET
	};
	var wrongCredentials = {
		AUTH0_DOMAIN: 'auth0-import-export-config.eu.auth0.com',
		AUTH0_CLIENT_ID: 'ML1P2J8WCSwoqyMbXxoAAYzhsNwvW3uV',
		AUTH0_CLIENT_SECRET: 'wrong_secret'
	};
	
	fs.writeFileSync(CREDENTIALS, JSON.stringify(credentials));
	fs.writeFileSync(WRONGCREDENTIALS, JSON.stringify(wrongCredentials));
	
	describe('a0dump', function() {
		if (fs.existsSync(EXPORTS)) {
			rimraf(EXPORTS);
		}
		
		it('should fail if the -c argument is not set', function () {
			var out = a0dump('sub', null);
			expect(`${out.stderr}`.trim()).to.be.equal('ERROR: Must set the config file');
			expect(out.status).to.not.be.equal(0);
		});
		it('should fail if the -c argument is an invalid file', function () {
			var out = a0dump('sub', '/path/to/nowhere.json');
			expect(`${out.stderr}`.trim()).to.be.equal('ERROR: /path/to/nowhere.json: Must be a valid file');
			expect(out.status).to.not.be.equal(0);
		});
		it('should fail if the -o argument is not set', function () {
			var out = a0dump(null, CREDENTIALS);
			expect(`${out.stderr}`.trim()).to.be.equal('ERROR: Must set the output directory');
			expect(out.status).to.not.be.equal(0);
		});
		it('should fail if the credentials are wrong', function () {
			var out = a0dump('wrong_creds', WRONGCREDENTIALS);
			expect(out.status).to.not.be.equal(0);
		});
		it('should import data with credentials passed in via command line arg', function () {
			var out = a0dump('wrong_creds', WRONGCREDENTIALS, SECRET);
			expect(out.status).to.be.equal(0);
		});
		it('should import data with the right structure', function () {
			var out = a0dump('structure_test');
			console.log(`${out.stdout}`);
			console.log(`${out.stderr}`);
			
			expect(out.status).to.be.equal(0);
			
			var exportPath = path.join(EXPORTS, 'structure_test');
			
			expect(exportPath).to.be.a.path();
			expect(path.join(exportPath,'clients')).to.be.a.path();
			expect(path.join(exportPath,'rules')).to.be.a.path();
			expect(path.join(exportPath,'database-connections')).to.be.a.path();
			[
				'clients/App2.json',
				'clients/Default App.json',
				//'clients/Deploy client.json',
				'clients/Non-interactive.json',
				'rules',
				'database-connections/custom-db/login.js',
					
			].forEach((f) => {
				expect(path.join(exportPath,f)).to.be.a.path();
			});
			
			//FIXME Pages dump not implemented
			//expect(path.join(exportPath,'pages')).to.be.a.path();
		});
	
		it('should be possible to deploy a dump', function () {
			var out;
			
			out = a0dump("dump_deployable");
			console.log(`${out.stdout}`);
			console.log(`${out.stderr}`);
			expect(out.status).to.be.equal(0);
			
			out = a0deploy("dump_deployable");
			var stdout = `${out.stdout}`;
			var stderr = `${out.stderr}`;
			console.log(stdout);
			console.log(stderr);
			expect(out.status).to.be.equal(0);
			expect(stdout).to.not.contain("StackTrace");
			expect(stderr).to.not.contain("StackTrace");
		});
	});
});
