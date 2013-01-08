var exphbs = require('express3-handlebars'),
    Y      = require('yui/handlebars'),

    config = require('../conf/config');

module.exports = exphbs.create({
    defaultLayout: config.layouts.main,
    handlebars   : Y.Handlebars,
    partialsDir  : config.dirs.templates
});
