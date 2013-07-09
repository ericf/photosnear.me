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
    res.expose(req.place, 'DATA.place');
    res.expose(req.photos, 'DATA.photos');
    res.expose({name: 'grid'}, 'VIEW');

    res.render('grid', {
        located: true,

        place: {
            id  : req.place.get('id'),
            text: req.place.toString()
        },

        photos: req.photos.toJSON()
    });
};
