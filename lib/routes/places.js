var Y = require('yui').use('parallel', 'pnm-place', 'pnm-photo', 'pnm-photos');

exports.load = function (req, res, next) {
    var place    = new Y.PNM.Place({id: req.params.id}),
        photos   = new Y.PNM.Photos(),
        requests = new Y.Parallel();

    place.load(requests.add());
    photos.load({place: place}, requests.add());

    requests.done(function (results) {
        var err;

        results.some(function (result) {
            if (result[0]) { return (err = result[0]); }
        });

        if (err) { return res.send(404, err); }

        req.place  = place;
        req.photos = photos;

        next();
    });
};

exports.render = function (req, res) {
    res.render(res.view, {
        located: true,

        place: {
            id  : req.place.get('id'),
            text: req.place.toString()
        },

        photos: req.photos.toJSON()
    });
};

exports.lookup = function (rootPath) {
    return function (req, res) {
        var place = new Y.PNM.Place();

        place.load({text: req.params.place}, function () {
            if (place.isNew()) {
                return res.send(404);
            }

            res.redirect(rootPath + place.get('id') + '/', 302);
        });
    };
};
