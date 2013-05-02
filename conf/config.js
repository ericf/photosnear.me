var path = require('path'),
    Y    = require('yui/oop'),

    NODE_ENV = process.env.NODE_ENV,
    PORT     = process.env.PORT,

    appRoot      = process.cwd(),
    isProduction = NODE_ENV === 'production',
    yuiFilter    = isProduction ? 'min' : 'raw',
    config       = require('./config.json');

// Poor-mans object clone.
function clone(config) {
    return JSON.parse(JSON.stringify(config));
}

// Wrap crazy YUI API.
function mix(config, overrides) {
    return Y.mix(config, overrides, true, null, 0, true);
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
