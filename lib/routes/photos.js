var Y = require('yui').use('pnm-photo');

exports.load = function (req, res, next) {
    var photo = new Y.PNM.Photo({id: req.params.id}),
        place;

    photo.load(function () {
        req.photo = photo;
        req.place = photo.get('location');

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

        photo: Y.merge({title: 'Photo'}, req.photo.getAttrs([
            'title', 'largeURL', 'pageURL'
        ]))
    });
};
