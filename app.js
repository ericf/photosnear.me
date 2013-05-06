var express = require('express'),
    state   = require('express-state'),
    myui    = require('modown-yui'),
    Locator = require('modown-locator'),

    config  = require('./conf/config'),
    PNM_ENV, app, hbs, middleware, routes, exposedRoutes, locator;

// -- Configure App ------------------------------------------------------------

app = express();

app.set('name', config.name);
app.set('env', config.env);
app.set('port', config.port);
app.set('state local', 'pnm_env');
app.set('state namespace', 'YUI.Env.PNM');

app.enable('strict routing');

app.expose(config.cache.client, 'CACHE');
app.expose(config.flickr, 'FLICKR');

app.locals({
    typekit: config.typekit
});

// -- Configure YUI ------------------------------------------------------------

PNM_ENV = app.yui.YUI.namespace('Env.PNM'),
PNM_ENV.CACHE  = config.cache.server;
PNM_ENV.FLICKR = config.flickr;

// -- Locator and plugins ------------------------------------------------------

locator = new Locator({
    buildDirectory: 'build'
});
locator.plug(app.yui.plugin({
    registerGroup: true,
    registerServerModules: true
}));
locator.parseBundle(__dirname, {}).then(function (have) {

    // custom modules should be registered manually or by adding a build.json
    // to build them during boot, which is also supported in express-yui
    app.yui.applyConfig({
        modules: {
            "ios-oc-fix": "/vendor/ios-orientationchange-fix.js",
            "pnm-templates": {
                "fullpath": "/templates.js",
                "requires": ["handlebars-base"]
            }
        }
    });

    app.configure('development', function () {
        app.yui.debugMode();
        app.yui.serveCoreFromAppOrigin();
        // watching for changes in yui modules
        locator.watch(__dirname);
    });
    app.configure('production', function () {
        app.yui.serveCoreFromCDN();
    });

    app.yui.serveGroupFromAppOrigin('photosnearme');
    app.yui.serveCombinedFromAppOrigin();

    // -- Views ----------------------------------------------------------------

    hbs = require('./lib/hbs')(app);
    app.engine(hbs.extname, hbs.engine);
    app.set('view engine', hbs.extname);
    app.set('views', config.dirs.views);

    // -- Middleware -----------------------------------------------------------

    middleware = require('./middleware');

    if (app.get('env') === 'development') {
        app.use(express.logger('tiny'));
    }

    app.use(express.compress());
    app.use(express.favicon());
    app.use(app.router);
    app.use(middleware.slash());
    app.use(myui.static());
    app.use(express.static(config.dirs.pub));
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

    exposeRoute('index', '/', myui.expose(), routes.index);

    exposeRoute('places', '/places/:id/', [
        myui.expose(),
        routes.places.load,
        middleware.exposeData('place', 'photos'),
        middleware.exposeView('grid'),
        routes.places.render
    ]);

    exposeRoute('photos', '/photos/:id/', [
        myui.expose(),
        routes.photos.load,
        middleware.exposeData('place', 'photo'),
        middleware.exposeView('lightbox'),
        routes.photos.render
    ]);

    app.get('/templates.js', routes.templates);

    PNM_ENV.ROUTES = exposedRoutes;
    app.expose(exposedRoutes, 'ROUTES');

});

// -- Exports ------------------------------------------------------------------

module.exports = app;
