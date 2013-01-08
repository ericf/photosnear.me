var Y = require('yui/handlebars'),

    templates = require('./templates');

// Export a compile() method for Express.
exports.compile = function (source, options) {
    var template = Y.Handlebars.compile(source),
        partials = templates.getRaw();

    return function (options) {
        return template(options, {partials: partials});
    };
};
