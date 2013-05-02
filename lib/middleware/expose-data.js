module.exports = function exposeData() {
    var keys = [].slice.call(arguments);

    return function (req, res, next) {
        var data = {};

        keys.forEach(function (key) {
            data[key] = req[key];
        });

        res.expose(data, 'DATA');
        next();
    };
};
