var express = require('express'),
    state   = require('express-state'),
    myui    = require('express-yui'),
    Locator = require('locator'),
    LocatorHandlebars = require('locator-handlebars'),

    config  = require('./conf/config'),
    app, middleware, routes, exposedRoutes, locator;

// -- Configure App ------------------------------------------------------------

app = express();

app.set('name', config.name);
app.set('env', config.env);
app.set('port', config.port);
app.set('state namespace', 'PNM');

app.enable('strict routing');

app.expose({}, 'DATA');
app.expose(config.cache.client, 'CACHE');
app.expose(config.flickr, 'FLICKR');

app.locals({
    typekit: config.typekit
});

// -- Configure YUI ------------------------------------------------------------

global.PNM = {};
PNM.CACHE  = config.cache.server;
PNM.FLICKR = config.flickr;

// custom modules should be registered manually or by adding a build.json
// to build them during boot, which is also supported in express-yui
app.yui.applyConfig({
    modules: {
        "ios-oc-fix": "/vendor/ios-orientationchange-fix.js"
    }
});

app.configure('development', function () {
    app.yui.debugMode();
    app.yui.setCoreFromAppOrigin();
});

// -- Views ----------------------------------------------------------------

app.set('view', app.yui.view({
    defaultLayout: 'main'
}));

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
        regex: route.regexp
    };
}

exposeRoute('index', '/', myui.expose(), routes.index);

exposeRoute('places', '/places/:id/', [
    myui.expose(),
    routes.places.load,
    routes.places.render
]);

exposeRoute('photos', '/photos/:id/', [
    myui.expose(),
    routes.photos.load,
    routes.photos.render
]);

PNM.ROUTES = exposedRoutes;
app.expose(exposedRoutes, 'ROUTES');

// -- Locator and plugins ------------------------------------------------------

new Locator({
    buildDirectory: 'build'
})
    .plug(LocatorHandlebars.yui())
    .plug(app.yui.plugin({
        registerGroup: true,
        registerServerModules: true
    }))
    .parseBundle(__dirname, {}).then(function () {

        app.yui.use('pnm-helpers');

        // the app is ready to receive traffic

    }, function (err) {
        console.error(err);
        console.error(err.stack);
    });

// -- Exports ------------------------------------------------------------------

module.exports = app;
