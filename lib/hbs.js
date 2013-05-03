var exphbs = require('express3-handlebars'),
    config = require('../conf/config');

module.exports = function (app) {
    var Y = app.yui.use('handlebars', 'pnm-helpers');
    return exphbs.create({
        defaultLayout: config.layouts.main,
        handlebars   : Y.Handlebars,
        helpers      : Y.PNM.Helpers,
        partialsDir  : config.dirs.templates
    });
};
