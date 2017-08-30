const request = require('request');
const HttpsProxyAgent = require('https-proxy-agent');
const winston = new require('./logger');

module.exports = function authenticate(config) {
	return new Promise((resolve, reject) => {
                const proxy = process.env.http_proxy;
                var agent = proxy ? new HttpsProxyAgent(proxy) : undefined;

		var options = {
			method: 'POST',
			url: 'https://'+config.AUTH0_DOMAIN+'/oauth/token',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				client_id: config.AUTH0_CLIENT_ID,
				client_secret: config.AUTH0_CLIENT_SECRET,
				audience:'https://'+config.AUTH0_DOMAIN+'/api/v2/',
				grant_type:'client_credentials'
			}),
                        agent
		};
		request(options, function (error, response, body) {
			if (error) {
				reject(error);
			}
			else if (response.statusCode != 200) {
				reject(new Error('HTTP code : ' + response.statusCode + '; ' + body));
			}
			else {
				winston.info('Authenticated');
				var json = JSON.parse(body);
				resolve(json.access_token);
			}
		});
	})
};
