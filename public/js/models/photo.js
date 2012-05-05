YUI.add('pnm-photo', function (Y) {

var FLICKR_API_KEY,

    Lang  = Y.Lang,
    Place = Y.PNM.Place,
    Photo;

Photo = Y.Base.create('photo', Y.Model, [Y.ModelSync.YQL], {

    cache  : new Y.CacheOffline(),
    query  : 'SELECT {attrs} FROM flickr.photos.info WHERE api_key={api_key} AND photo_id={id}',
    imgUrl : 'http://farm{farm}.static.flickr.com/{server}/{id}_{secret}_{size}.jpg',
    pageUrl: 'http://www.flickr.com/photos/{user}/{id}/',

    buildQuery: function () {
        // one time initialization for FLICKR_API_KEY in lazy mode
        FLICKR_API_KEY = FLICKR_API_KEY || YUI.namespace('Env.Flickr').API_KEY || '';

        return Lang.sub(this.query, {
            api_key: FLICKR_API_KEY,
            id     : this.get('id'),
            attrs  : Photo.YQL_ATTRS
        });
    },

    parse: function (results) {
        if (!results) { return; }

        var photo    = Y.merge(results.photo),
            location = photo.location,
            country  = location.country,
            region   = location.region,
            locality = location.locality;

        photo.location = {
            woeid    : location.woeid,
            latitude : location.latitude,
            longitude: location.longitude,
            country  : country && country.content,
            region   : region && region.content,
            locality : locality && locality.content
        };

        return photo;
    },

    getImgUrl: function (size) {
        var attrs = this.getAttrs(['id', 'farm', 'server', 'secret']),
            url   = Lang.sub(this.imgUrl, Y.merge(attrs, {size: size}));

        // Append dynamic flag "zz=1" if we are generating the URL.
        if (size === 'z') {
            url += '?zz=1';
        }

        return url;
    },

    // Insired by: Lucas Smith
    // (http://lucassmith.name/2008/11/is-my-image-loaded.html)
    loadImg: function (callback) {
        var img  = new Image(),
            prop = img.naturalWidth ? 'naturalWidth' : 'width';

        Lang.isFunction(callback) || (callback = function () {});

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
        farm     : {},
        server   : {},
        secret   : {},
        owner    : {},
        pathalias: {},
        title    : {},
        url_sq   : {},
        url_z    : {},

        location: {
            value : {},
            setter: function (location) {
                (location instanceof Place) || (location = new Place(location));
                return location;
            }
        },

        thumbUrl: {
            readOnly: true,
            getter  : function () {
                return this.get('url_sq') || this.getImgUrl('s');
            }
        },

        largeUrl: {
            readOnly: true,
            getter  : function () {
                return this.get('url_z') || this.getImgUrl('z');
            }
        },

        pageUrl: {
            readOnly: true,
            getter  : function () {
                var user = this.get('pathalias') || this.get('owner');
                return Lang.sub(this.pageUrl, {
                    id  : this.get('id'),
                    user: Lang.isString(user) ? user : user.nsid
                });
            }
        }
    },

    YQL_ATTRS: [
        'id', 'farm', 'server', 'secret', 'owner', 'pathalias', 'title',
        'location', 'url_sq', 'url_z'
    ]

});

Y.namespace('PNM').Photo = Photo;

}, '0.5.0', {
    requires: [
        'gallery-model-sync-yql',
        'cache-offline',
        'model',
        'pnm-place',
        'yql'
    ]
});
