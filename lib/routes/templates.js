var connect = require('connect');

module.exports = function (req, res, next) {
    var cached      = req.app.enabled('view cache'),
        precompiled = require('../templates').getPrecompiled(),
        templates   = [];

    Object.keys(precompiled).forEach(function (name) {
        templates.push({
            name    : name,
            template: precompiled[name]
        });
    });

    res.render('templates', {
        layout   : false,
        templates: templates
    }, function (err, view) {
        if (err) { return next(err); }

        res.header('Content-Type', 'application/javascript');
        res.header('ETag', connect.utils.md5(view));

        res.body = view;

        next();
    });
};
