var connect = require('connect'),
    hbs     = require('../hbs');

module.exports = function (req, res, next) {
    hbs.getPartials({
        cache      : req.app.enabled('view cache'),
        precompiled: true
    }, function (err, partials) {
        if (err) { return next(err); }

        var templates = [];

        Object.keys(partials).forEach(function (name) {
            templates.push({
                name    : name,
                template: partials[name]
            });
        });

        res.render('templates', {
            layout   : false,
            templates: templates
        }, function (err, view) {
            if (err) { return next(err); }

            res.set('Content-Type', 'application/javascript');
            res.set('ETag', connect.utils.md5(view));
            res.body = view;

            next();
        });
    });
};
