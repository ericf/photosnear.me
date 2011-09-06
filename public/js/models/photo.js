YUI.add('photo', function (Y) {

var Lang     = Y.Lang,
    sub      = Lang.sub,
    isString = Lang.isString;

Y.Photo = Y.Base.create('photo', Y.Model, [Y.ModelSync.YQL], {

    cache  : new Y.CacheOffline(),
    query  : 'SELECT * FROM flickr.photos.info WHERE photo_id={id}',
    imgUrl : 'http://farm{farm}.static.flickr.com/{server}/{id}_{secret}_{size}.jpg',
    pageUrl: 'http://www.flickr.com/photos/{user}/{id}/',

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
        return sub(this.imgUrl, {
            id    : this.get('id'),
            farm  : this.get('farm'),
            server: this.get('server'),
            secret: this.get('secret'),
            size  : size
        });
    },

    loadImg: function (callback) {
        // insired by: Lucas Smith
        // (http://lucassmith.name/2008/11/is-my-image-loaded.html)

        var img  = new Image(),
            prop = img.naturalWidth ? 'naturalWidth' : 'width';

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
                return ((place instanceof Y.Place) ? place : new Y.Place(place));
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
                return sub(this.pageUrl, {
                    id  : this.get('id'),
                    user: isString(user) ? user : user.nsid
                });
            }
        }
    }
});

}, '0.3.2', {
    requires: [ 'model'
              , 'yql'
              , 'gallery-model-sync-yql'
              , 'cache-offline'
              , 'place'
              ]
});
