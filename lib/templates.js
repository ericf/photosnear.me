var fs   = require('fs'),
    path = require('path'),
    Y    = require('yui/handlebars'),

    config = require('../conf/config'),

    cache        = {},
    isProduction = config.env.production;

function getRaw() {
    if (isProduction && cache.raw) {
        return Y.merge(cache.raw);
    }

    var raw          = {},
        templatesDir = config.templatesDir,
        files        = path.existsSync(templatesDir) &&
                            fs.readdirSync(templatesDir, 'utf8');

    if (files && files.length) {
        files.forEach(function (file) {
            if (path.extname(file) !== '.handlebars') { return; }

            var name     = file.replace('.handlebars', ''),
                template = fs.readFileSync(path.join(templatesDir, file), 'utf-8');

            raw[name] = template;
        });
    }

    if (isProduction) {
        cache.raw = Y.merge(raw);
    }

    return raw;
}
exports.getRaw = getRaw;

function getPrecompiled() {
    if (isProduction && cache.precompiled) {
        return Y.merge(cache.precompiled);
    }

    var raw         = getRaw(),
        precompiled = {};

    Object.keys(raw).forEach(function (name) {
        precompiled[name] = Y.Handlebars.precompile(raw[name]);
    });

    if (isProduction) {
        cache.precompiled = Y.merge(precompiled);
    }

    return precompiled;
}
exports.getPrecompiled = getPrecompiled;
