var fs   = require('fs'),
    path = require('path'),
    Y    = require('yui/oop'),

    CONFIG_FILE = 'config.json',
    NODE_ENV    = process.env.NODE_ENV,
    PORT        = process.env.PORT,

    appRoot      = process.cwd(),
    configFile   = path.join(__dirname, CONFIG_FILE),
    isProduction = NODE_ENV === 'production',
    yuiFilter    = isProduction ? 'min' : 'raw',
    config;

// Poor-mans object clone.
function clone(config) {
    return JSON.parse(JSON.stringify(config));
}

// Wrap crazy YUI API.
function mix(config, overrides) {
    return Y.mix(config, overrides, true, null, 0, true);
}

if (fs.existsSync(configFile)) {
    try {
        config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    } catch (e) {
        console.error('Could not parse config file.');
    }
} else {
    console.error('Could not read config file: ' + configFile);
}

// Quit if we cannot process the config file.
if (!config) {
    process.exit(1);
}

config.env  = NODE_ENV || 'development';
config.port = PORT || config.port;

Y.Object.each(config.dirs, function (dir, name, dirs) {
    dirs[name] = path.join(appRoot, dir);
});

// YUI on the server.
mix(config.yui.server, {
    filter: yuiFilter,

    groups: {
        server: {
            base   : appRoot,
            filter : yuiFilter,
            modules: clone(config.yui.modules.server)
        },

        shared: {
            base   : path.join(appRoot, config.yui.server.groups.shared.base),
            filter : yuiFilter,
            modules: clone(config.yui.modules.shared)
        }
    }
});

// YUI on the client.
mix(config.yui.client, {
    combine: isProduction,
    filter : yuiFilter,

    groups: {
        client: {
            combine: isProduction,
            filter : yuiFilter,
            modules: clone(config.yui.modules.client)
        },

        shared: {
            combine: isProduction,
            filter : yuiFilter,
            modules: clone(config.yui.modules.shared)
        }
    }
});

// Remove modules from parsed YUI config.
delete config.yui.modules;

module.exports = config;
