var exphbs = require('express3-handlebars'),
    Y      = require('yui').use('handlebars', 'pnm-helpers'),

    config = require('../conf/config');

module.exports = exphbs.create({
    defaultLayout: config.layouts.main,
    handlebars   : Y.Handlebars,
    helpers      : Y.PNM.Helpers,
    partialsDir  : config.dirs.templates
});
