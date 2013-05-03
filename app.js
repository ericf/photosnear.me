var combo   = require('combohandler'),
    express = require('express'),
    state   = require('express-state'),
    myui    = require('modown-yui'),
    Locator = require('modown-locator'),
    yui     = require('yui'),

    PNM_ENV = yui.YUI.namespace('Env.PNM'),

    config = require('./conf/config'),
    app, hbs, middleware, routes, exposedRoutes, locator;

// -- Configure YUI ------------------------------------------------------------

// Applies config to shared YUI instance.
yui.getInstance().applyConfig(config.yui.server);

PNM_ENV.CACHE  = config.cache.server;
PNM_ENV.FLICKR = config.flickr;

// -- Configure App ------------------------------------------------------------

app = express();
hbs = require('./lib/hbs');

app.set('name', config.name);
app.set('env', config.env);
app.set('port', config.port);
app.set('state local', 'pnm_env');
app.set('state namespace', 'YUI.Env.PNM');

app.engine(hbs.extname, hbs.engine);
app.set('view engine', hbs.extname);
app.set('views', config.dirs.views);

app.enable('strict routing');

app.expose(config.cache.client, 'CACHE');
app.expose(config.flickr, 'FLICKR');
app.expose(config.yui.client, 'window.YUI_config', 'yui_config');

app.locals({
    min        : config.env === 'production' ? '-min' : '',
    typekit    : config.typekit,
    yui_version: config.yui.version
});

// -- Locator and plugins ------------------------------------------------------

locator = new Locator({
    buildDirectory: 'build'
});
locator.plug(app.yui.plugin({
    registerGroup: true
}));
locator.parseBundle(__dirname, {}).then(function (have) {

    // -- Middleware ---------------------------------------------------------------

    middleware = require('./middleware');

    if (app.get('env') === 'development') {
        app.use(express.logger('tiny'));
    }

    app.use(express.compress());
    app.use(express.favicon());
    app.use(app.router);
    app.use(middleware.slash());
    app.use(express.static(config.dirs.pub));
    app.use(express.static(config.dirs.shared));
    app.use(middleware.placeLookup('/places/'));

    if (app.get('env') === 'development') {
        app.use(express.errorHandler({
            dumpExceptions: true,
            showStack     : true
        }));
    } else {
        app.use(express.errorHandler());
    }

    // -- Routes -------------------------------------------------------------------

    routes        = require('./routes');
    exposedRoutes = {};

    function exposeRoute(name) {
        var args = [].slice.call(arguments, 1),
            routes, route;

        app.get.apply(app, args);

        routes = app.routes.get;
        route  = routes[routes.length -1];

        exposedRoutes[name] = {
            path : route.path,
            keys : route.keys,
            regex: route.regexp.toString()
        };
    }

    exposeRoute('index', '/', routes.index);

    exposeRoute('places', '/places/:id/', [
        routes.places.load,
        middleware.exposeData('place', 'photos'),
        middleware.exposeView('grid'),
        routes.places.render
    ]);

    exposeRoute('photos', '/photos/:id/', [
        routes.photos.load,
        middleware.exposeData('place', 'photo'),
        middleware.exposeView('lightbox'),
        routes.photos.render
    ]);

    app.get('/combo', [
        combo.combine({rootPath: config.dirs.pub_js}),
        combo.respond
    ]);

    app.get('/shared/combo', [
        combo.combine({rootPath: config.dirs.shared_js}),
        combo.respond
    ]);

    app.get('/templates.js', routes.templates);

    PNM_ENV.ROUTES = exposedRoutes;
    app.expose(exposedRoutes, 'ROUTES');

});

// -- Exports ------------------------------------------------------------------

module.exports = app;
