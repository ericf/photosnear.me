module.exports = function (expyui) {
    return function (req, res, next) {
        var method = req.method.toLowerCase(),
            routes, match, noop;

        if (method !== 'get') {
            next();
            return;
        }

        routes = req.app.routes[method];
        match  = routes && routes.some(function (r) {
            return r.match(req.url);
        });

        if (!match) {
            next();
            return;
        }

        expyui.expose().forEach(function (middleware) {
            var noop = function () {};
            middleware(req, res, noop);
        });

        next();
    };
};
