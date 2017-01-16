# auth0-dump-config
Auth0 configuration dump tool

[![wercker status](https://app.wercker.com/status/9c3801d9c1c740834c61da5a925d4ca9/s/master "wercker status")](https://app.wercker.com/project/byKey/9c3801d9c1c740834c61da5a925d4ca9)

Command line tool for dumping your configuration to Auth0.
The dump follows the directory structure required by [auth0-deploy-cli](https://github.com/auth0/auth0-deploy-cli).

## Installation
```bash
npm install -g auth0-dump-config
```

## Setup
You need a configured client on Auth0 and a config file to run the tool. 
1. Create a deploy client : see [auth0-deploy-cli README](https://github.com/auth0/auth0-deploy-cli/blob/master/README.md).
1. Create the credentials file : refer to the sample file `a0deploy_config.json.sample` and fill in the credentials.
You can find them in the settings of the client you created.

## Usage

#### Import configuration
```bash
a0dump -c /path/to/a0deploy_config.json -o /path/to/config/files
```

#### Repository Structure
The repository structure is the same as [auth0-deploy-cli](https://github.com/auth0/auth0-deploy-cli).
```
repository => 
  clients
    client1-name.json
    client1-name.meta.json # if specifying client grants
    my-other-client-name.json
  resource-servers
    resource server 1.json
    some other resource server.json
  database-connections
    my-connection-name
      get_user.js
      login.js
  rules
    rule1.js
    rule1.json
    rule2.js
  pages
    login.html
    login.json
    password_reset.html
    password_reset.json
```
    
## Limitations
- Hosted pages dump is not supported.