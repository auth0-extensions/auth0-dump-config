const program = require('commander');
const Command = require('commander').Command;
const fs = require('fs');
const path = require('path');

program
.option('-c,--config_file <config file>', 'The JSON configuration file.', checkFileExists)
.option('-x,--secret <secret>', 'The client secret, this allows you to encrypt the secret in your build configuration instead of storing it in a config file');

function printHelpAndExit(error) {
	program.outputHelp();
	if (error) {
		process.stderr.write('ERROR: ' + error + '\n');
	}
	process.exit(2);
}

/**
 * Validate that the argument is actually a file that we can read.
 * @param fileName The name of the file to check
 * @returns {*}
 */
function checkFileExists(fileName) {
	try {
		fs.accessSync(fileName, fs.F_OK);
		return fileName;
	} catch (e) {
		printHelpAndExit(fileName + ': Must be a valid file\n');
		return false;
	}
}
//----------------------------------------------------------------------------------------------------------------------

var baseParse = program.parse;
program.parse = function(args) {
	baseParse.call(program, args);
	
	if (!program.config_file) {
		printHelpAndExit('Must set the config file');
	}
	
	return program;
};

program.checkFileExists = checkFileExists;
program.printHelpAndExit = printHelpAndExit;
module.exports = program;
