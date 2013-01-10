var hbs = require('../hbs');

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

        res.set('Content-Type', 'application/javascript');

        res.render('templates', {
            layout   : false,
            templates: templates
        });
    });
};
