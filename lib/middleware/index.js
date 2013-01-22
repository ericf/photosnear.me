exports.exposeData = function () {
    var keys = [].slice.call(arguments);

    return function (req, res, next) {
        var data = {};

        keys.forEach(function (key) {
            data[key] = JSON.stringify(req[key]);
        });

        res.expose(data, 'YUI.Env.PNM.DATA', 'pnm_env');
        next();
    }
};

exports.exposeView = function (view) {
    return function (req, res, next) {
        res.view = view;
        res.expose({name: view}, 'YUI.Env.PNM.VIEW', 'pnm_env');
        next();
    }
};
