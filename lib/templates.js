var fs   = require('fs'),
    path = require('path'),
    Y    = require('yui/handlebars'),

    config = require('../conf/config');

var raw          = {},
    precompiled  = {},
    templatesDir = config.templatesDir,
    files        = path.existsSync(templatesDir) &&
                        fs.readdirSync(templatesDir, 'utf8');

if (files && files.length) {
    files.forEach(function (file) {
        if (path.extname(file) !== '.handlebars') { return; }

        var name     = file.replace('.handlebars', ''),
            template = fs.readFileSync(path.join(templatesDir, file), 'utf-8');

        raw[name]         = template;
        precompiled[name] = Y.Handlebars.precompile(template);
    });
}

exports.raw         = raw;
exports.precompiled = precompiled;
