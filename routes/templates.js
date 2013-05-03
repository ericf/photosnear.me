var hbs;

module.exports = function (req, res, next) {

    hbs = hbs || require('../lib/hbs')(req.app);

    hbs.loadPartials({
        cache      : req.app.enabled('view cache'),
        precompiled: true
    }, function (err, partials) {
        if (err) { return next(err); }

        var templates = Object.keys(partials).map(function (name) {
            return {
                name    : name,
                template: partials[name]
            };
        });

        res.set('Content-Type', 'application/javascript');
        res.render('templates', {
            layout   : false,
            templates: templates
        });
    });
};
