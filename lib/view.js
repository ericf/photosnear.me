var Y = require('yui/handlebars'),

    templates = require('./templates').raw;

global.Handlebars = Y.Handlebars;

// Register all templates as partials.
Y.Object.each(templates, function (template, name) {
    Y.Handlebars.registerPartial(name, template);
});

// Export a compile() method for Express.
exports.compile = function (source, options) {
    var template = Y.Handlebars.compile(source);

    return function (options) {
        return template(options, options.helpers);
    }
};
