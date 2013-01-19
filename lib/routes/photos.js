var Y = require('yui').use('pnm-photo');

module.exports = function (req, res) {
    var photo = new Y.PNM.Photo({id: req.params.id}),
        place;

    photo.load(function () {
        place = photo.get('location');

        res.render('lightbox', {
            located: true,

            place: {
                id  : place.get('id'),
                text: place.toString()
            },

            photo: Y.merge({title: 'Photo'}, photo.getAttrs([
                'title', 'largeUrl', 'pageUrl'
            ])),

            initialData: {
                place: JSON.stringify(place),
                photo: JSON.stringify(photo)
            },

            initialView: 'lightbox'
        });
    });
};
