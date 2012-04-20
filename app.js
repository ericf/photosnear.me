require('./conf/config');

var connect = require('connect'),
    combo   = require('combohandler'),
    express = require('express'),
    YUI     = require('yui').YUI,

    app    = express.createServer(),
    pubDir = global.config.pubDir,
    Y      = YUI(global.config.yui.server).use('pnm-place');

// -- Express config -----------------------------------------------------------
app.configure('development', function () {
    // Gives us pretty logs in development. Must run before other middleware.
    app.use(express.logger(
        '[:date] :req[x-forwarded-for] ":method :url" :status [:response-time ms]'
    ));
});

app.configure(function () {
    // Don't ignore trailing slashes in routes.
    app.set('strict routing', true);

    // Use our custom Handlebars-based view engine as the default.
    app.register('.handlebars', require('./lib/view'));
    app.set('view engine', 'handlebars');

    // Local values that will be shared across all views. Locals specified at
    // render time will override these values if they share the same name.
    app.set('view options', Y.merge(require('./conf/common'), {
        config: global.config
    }));

    // Middleware.
    app.use(app.router);
    app.use(express.favicon());
    app.use(express.static(pubDir));
});

app.configure('development', function () {
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack     : true
    }));
});

app.configure('production', function () {
    app.enable('view cache');
    app.use(express.errorHandler());
});

// -- Routes -------------------------------------------------------------------

// Root.
app.get('/', function (req, res) {
    res.render('index');
});

// Combo-handler for JavaScript.
app.get('/combo', combo.combine({rootPath: pubDir + '/js'}), function (req, res) {
    if (connect.utils.conditionalGET(req)) {
        if (!connect.utils.modified(req, res)) {
            return connect.utils.notModified(res);
        }
    }

    res.send(res.body, 200);
});

// Dymanic resource for precompiled templates.
app.get('/templates.js', (function () {
    var precompiled = require('./lib/templates').precompiled,
        templates   = [];

    Y.Object.each(precompiled, function (template, name) {
        templates.push({
            name    : name,
            template: template
        });
    });

    return function (req, res) {
        res.render('templates', {
            layout   : false,
            templates: templates
        }, function (err, view) {
            res.send(view, {'Content-Type': 'application/javascript'}, 200);
        });
    };
}()));

app.get('/place', function (req, res) {
    var place = new Y.PNM.Place({
        id: '28288771'
    });

    place.load(function () {
        res.render('index', {
            place: {
                id  : place.get('id'),
                text: place.toString()
            }
        });
    });
});

module.exports = app;
