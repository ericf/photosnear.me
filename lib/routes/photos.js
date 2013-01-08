var YUI = require('yui').YUI,

    config = require('../../conf/config'),
    Y      = YUI(config.yui.server);

YUI.namespace('Env.Flickr').API_KEY = config.flickr.api_key;
Y.use('pnm-photo');

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
