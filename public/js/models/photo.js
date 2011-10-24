YUI.add('photo', function (Y) {

var Lang = Y.Lang,

    FLICKR_API_KEY = YUI.namespace('Env.Flickr').API_KEY || '';

Y.Photo = Y.Base.create('photo', Y.Model, [Y.ModelSync.YQL], {

    cache  : new Y.CacheOffline(),
    query  : 'SELECT * FROM flickr.photos.info WHERE api_key={api_key} AND photo_id={id}',
    imgUrl : 'http://farm{farm}.static.flickr.com/{server}/{id}_{secret}_{size}.jpg',
    pageUrl: 'http://www.flickr.com/photos/{user}/{id}/',

    buildQuery: function () {
        return Lang.sub(this.query, {
            api_key: FLICKR_API_KEY,
            id     : this.get('id')
        });
    },

    parse: function (results) {
        if ( ! results) { return; }

        var photo    = results.photo,
            place    = photo.location,
            country  = place.country,
            region   = place.region,
            locality = place.locality;

        photo.place = {
            woeid    : place.woeid,
            latitude : place.latitude,
            longitude: place.longitude,
            country  : country && country.content,
            region   : region && region.content,
            locality : locality && locality.content
        };

        return photo;
    },

    getImgUrl: function (size) {
        return Lang.sub(this.imgUrl, {
            id    : this.get('id'),
            farm  : this.get('farm'),
            server: this.get('server'),
            secret: this.get('secret'),
            size  : size
        });
    },

    loadImg: function (callback) {
        // Insired by: Lucas Smith
        // (http://lucassmith.name/2008/11/is-my-image-loaded.html)
        var img  = new Image(),
            prop = img.naturalWidth ? 'naturalWidth' : 'width';

        Lang.isFunction(callback) || (callback = function() {});

        img.src = this.get('largeUrl');

        if (img.complete) {
            callback.call(this, img[prop] ? img : null);
        } else {
            img.onload  = Y.bind(callback, this, img);
            img.onerror = Y.bind(callback, this, null);
        }
    }

}, {

    ATTRS: {
        farm       : {},
        server     : {},
        secret     : {},
        owner      : {},
        pathalias  : {},
        title      : {},
        description: {},

        place: {
            value : {},
            setter: function (place) {
                (place instanceof Y.Place) || (place = new Y.Place(place));
                return place;
            }
        },

        thumbUrl: {
            getter: function () {
                return this.getImgUrl('s');
            }
        },

        largeUrl: {
            getter: function () {
                return this.getImgUrl('z');
            }
        },

        pageUrl: {
            getter: function () {
                var user = this.get('pathalias') || this.get('owner');
                return Lang.sub(this.pageUrl, {
                    id  : this.get('id'),
                    user: Lang.isString(user) ? user : user.nsid
                });
            }
        }
    }

});

}, '0.3.2', {
    requires: [ 'gallery-model-sync-yql'
              , 'cache-offline'
              , 'model'
              , 'place'
              , 'yql'
              ]
});
