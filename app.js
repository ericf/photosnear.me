var connect = require('connect'),
    combo   = require('combohandler'),
    express = require('express'),
    Y       = require('yui/oop'),

    config     = require('./conf/config'),
    middleware = require('./lib/middleware'),
    routes     = require('./lib/routes'),
    app        = express.createServer();

// -- Express config -----------------------------------------------------------
app.configure('development', function () {
    // Gives us pretty logs in development. Must run before other middleware.
    app.use(express.logger(
        '[:date] :req[x-forwarded-for] ":method :url" :status [:response-time ms]'
    ));
});

app.configure(function () {
    var common = require('./conf/common'),
        dirs   = config.dirs;

    // Use our custom Handlebars-based view engine as the default.
    app.register('.handlebars', require('./lib/view'));
    app.set('view engine', 'handlebars');

    app.set('views', dirs.views);
    app.set('strict routing', true);

    // Local values that will be shared across all views. Locals specified at
    // render time will override these values if they share the same name.
    app.set('view options', Y.merge(common, {config: config}));

    // Middleware.
    app.use(express.favicon());
    app.use(express.static(config.dirs.pub));
    app.use(express.static(config.dirs.shared));
    app.use(app.router);
});

app.configure('development', function () {
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack     : true
    }));
});

app.configure('production', function () {
    // Renable these when minification is done async!
    // app.enable('minify templates');
    // app.enable('minify js');

    app.enable('view cache');
    app.use(express.errorHandler());
});

// -- Routes -------------------------------------------------------------------
app.get('/',            routes.index);
app.get('/places/:id/', routes.places.place);
app.get('/photos/:id/', routes.photos);

app.get('/combo',        routes.combo.pub,    middleware.conditional);
app.get('/shared/combo', routes.combo.shared, middleware.conditional);
app.get('/templates.js', routes.templates,    middleware.conditional);

// Catch-all route to dynamically figure out the place based on text.
// **Note:** This needs to be the last route.
app.get('/:place', routes.places.lookup('/places/'));

module.exports = app;
