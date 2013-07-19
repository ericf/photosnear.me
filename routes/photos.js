var Y;

exports.load = function (req, res, next) {
    // Load YUI modules, once.
    Y || (Y = req.app.yui.use('pnm-photo'));

    var photo = new Y.PNM.Photo({id: req.params.id}),
        place;

    photo.load(function () {
        req.photo = photo;
        req.place = photo.get('location');

        next();
    });
};

exports.render = function (req, res) {
    res.expose(req.place, 'DATA.place');
    res.expose(req.photo, 'DATA.photo');
    res.expose({name: 'lightbox'}, 'VIEW');

    res.render('lightbox-page', {
        located: true,

        place: {
            id  : req.place.get('id'),
            text: req.place.toString()
        },

        photo: Y.merge({title: 'Photo'}, req.photo.getAttrs([
            'title', 'largeURL', 'pageURL'
        ]))
    });
};
