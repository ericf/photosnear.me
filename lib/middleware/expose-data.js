module.exports = function exposeData() {
    var keys = [].slice.call(arguments);

    return function (req, res, next) {
        var data = {};

        keys.forEach(function (key) {
            data[key] = JSON.stringify(req[key]);
        });

        res.expose(data, 'YUI.Env.PNM.DATA', 'pnm_env');
        next();
    };
};
