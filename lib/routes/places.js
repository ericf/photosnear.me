var Y = require('yui').use('parallel', 'pnm-place', 'pnm-photo', 'pnm-photos');

module.exports = function (req, res) {
    var place    = new Y.PNM.Place({id: req.params.id}),
        photos   = new Y.PNM.Photos(),
        requests = new Y.Parallel();

    place.load(requests.add());
    photos.load({place: place}, requests.add());

    requests.done(function () {
        res.expose({
            DATA: {
                place : JSON.stringify(place),
                photos: JSON.stringify(photos)
            },

            VIEW: 'grid'
        }, 'YUI.Env.PNM', 'pnm_env');

        res.render('grid', {
            located: true,

            place: {
                id  : place.get('id'),
                text: place.toString()
            },

            photos: photos.map(function (photo) {
                return photo.getAttrs(['id', 'title', 'thumbUrl']);
            })
        });
    });
};

module.exports.lookup = function (rootPath) {
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
