var path = require('path'),
    Y    = require('yui/oop'),

    NODE_ENV = process.env.NODE_ENV,
    PORT     = process.env.PORT,

    appRoot      = process.cwd(),
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

module.exports = config;
