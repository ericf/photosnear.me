YUI.add('pnm-photos', function (Y) {

var FLICKR_ENV = YUI.namespace('Env.Flickr'),

    Lang     = Y.Lang,
    DataURIs = Y.PNM.DataURIs,
    Photo    = Y.PNM.Photo,
    Photos;

Photos = Y.Base.create('photos', Y.ModelList, [Y.ModelSync.YQL], {

    model: Photo,
    cache: new Y.CacheOffline(),
    query: 'SELECT {attrs} FROM flickr.photos.search({start},{num}) ' +
                'WHERE api_key={api_key} ' +
                'AND safe_search=1 ' +
                'AND woe_id={woeid} ' +
                'AND sort="interestingness-desc" ' +
                'AND extras="path_alias,url_sq,url_z"',

    buildQuery: function (options) {
        options || (options = {});

        return Lang.sub(this.query, {
            api_key: FLICKR_ENV.API_KEY || '',
            start  : options.start || 0,
            num    : options.num || 60,
            woeid  : options.place.get('id'),
            attrs  : Photo.YQL_ATTRS
        });
    },

    sync: function (action, options, callback) {
        options || (options = {});

        var self    = this,
            yqlSync = Y.ModelSync.YQL.prototype.sync;

        if (!options.dataURIs) {
            return yqlSync.apply(self, arguments);
        }

        yqlSync.call(self, action, options, function (err, res) {
            if (err) { return callback(err, res); }

            var requests     = new Y.Parallel(),
                dataURILists = [],
                photos, thumbURLs, getAsync;

            photos = Y.Array.map(res && res.photo, function (photo) {
                return new self.model(photo);
            });

            thumbURLs = Y.Array.map(photos, function (photo) {
                return photo.get('thumbUrl');
            });

            while (thumbURLs.length) {
                dataURILists.push(new DataURIs().load({
                    urls: thumbURLs.splice(0, options.dataURIs)
                }, requests.add()));
            }

            requests.done(function () {
                var dataURIs = new DataURIs();

                Y.Array.each(dataURILists, function (list) {
                    dataURIs.add(list, {silent: true});
                });

                Y.Array.each(photos, function (photo, i) {
                    var item    = dataURIs.item(i),
                        dataURI = item && item.get('url');

                    dataURI && photo.set('url_sq', dataURI);
                });

                callback(null, photos);
            });
        });
    },

    parse: function (results) {
        if (Lang.isArray(results)) {
            return results;
        }

        var photos = results ? results.photo : [];
        return Lang.isArray(photos) ? photos : [photos];
    },

    getPrev: function (photo) {
        // Check that the photo is in the list first.
        if (photo && this.getByClientId(photo.get('clientId'))) {
            return this.item(this.indexOf(photo) - 1);
        }
    },

    getNext: function (photo) {
        // Check that the photo is in the list first.
        if (photo && this.getByClientId(photo.get('clientId'))) {
            return this.item(this.indexOf(photo) + 1);
        }
    }

});

Y.namespace('PNM').Photos = Photos;

}, '0.5.2', {
    requires: [
        'cache-offline',
        'gallery-model-sync-yql',
        'model-list',
        'pnm-datauris',
        'pnm-photo',
        'yql'
    ]
});
