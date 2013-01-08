var YUI = require('yui').YUI,

    config = require('../../conf/config'),
    Y      = YUI(config.yui.server);

YUI.namespace('Env.Flickr').API_KEY = config.flickr.api_key;
Y.use('parallel', 'pnm-place', 'pnm-photo', 'pnm-photos');

module.exports = {
    place: function (req, res) {
        var place    = new Y.PNM.Place({id: req.params.id}),
            photos   = new Y.PNM.Photos(),
            requests = new Y.Parallel();

        place.load(requests.add());
        photos.load({place: place}, requests.add());

        requests.done(function () {
            res.render('grid', {
                located: true,

                place: {
                    id  : place.get('id'),
                    text: place.toString()
                },

                photos: photos.map(function (photo) {
                    return photo.getAttrs(['id', 'title', 'thumbUrl']);
                }),

                initialData: {
                    place : JSON.stringify(place),
                    photos: JSON.stringify(photos)
                },

                initialView: 'grid'
            });
        });
    },

    lookup: function (rootPath) {
        return function (req, res) {
            var place = new Y.PNM.Place();

            place.load({text: req.params.place}, function () {
                if (place.isNew()) {
                    return res.send(404);
                }

                res.redirect(rootPath + place.get('id') + '/', 302);
            });
        };
    }
};
