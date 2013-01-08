var connect = require('connect'),
    combo   = require('combohandler'),
    express = require('express'),
    Y       = require('yui/oop'),

    config     = require('./conf/config'),
    common     = require('./conf/common'),
    middleware = require('./lib/middleware'),
    routes     = require('./lib/routes'),
    hbs        = require('./lib/hbs'),

    app = express();

// -- Express config -----------------------------------------------------------
app.configure('development', function () {
    // Gives us pretty logs in development. Must run before other middleware.
    app.use(express.logger(
        '[:date] :req[x-forwarded-for] ":method :url" :status [:response-time ms]'
    ));
});

app.configure(function () {
    var dirs = config.dirs;

    app.set('name', config.name);

    // Use our custom Handlebars-based view engine as the default.
    app.engine('.handlebars', hbs.engine);
    app.set('view engine', 'handlebars');

    app.set('views', dirs.views);
    app.set('strict routing', true);

    // Local values that will be shared across all views. Locals specified at
    // render time will override these values if they share the same name.
    app.locals(Y.merge(common, {config: config}));

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
