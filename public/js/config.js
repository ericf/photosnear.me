(function () {

var FLICKR_API_KEY = '0984607e2222db7a1be6a5692741ca08',
    TYPEKIT_ID     = 'wkh7ffm',

    filter = (window.location.search.match(/[?&]filter=([^&]+)/) || [])[1] || 'min';

YUI.GlobalConfig = {
    base       : 'http://yui.ericf.me/?/',
    comboBase  : 'http://yui.ericf.me/?',
    root       : '/',
    filter     : filter,
    combine    : filter === 'min',
    allowRollup: false,
    gallery    : 'gallery-2011.10.20-23-28',

    modules: {
        typekit: 'http://use.typekit.com/' + TYPEKIT_ID + '.js'
    },

    groups: {
        photosnearme: {
            base     : '/js/',
            comboBase: '/js/?',
            combine  : filter === 'min',
            root     : '/',
            modules  : {
                'pnm-place': {
                    path    : 'models/place.js',
                    requires: [ 'cache-offline'
                              , 'gallery-model-sync-yql'
                              , 'model'
                              , 'yql'
                              ]
                },

                'pnm-photo': {
                    path    : 'models/photo.js',
                    requires: [ 'gallery-model-sync-yql'
                              , 'cache-offline'
                              , 'model'
                              , 'pnm-place'
                              , 'yql'
                              ]
                },

                'pnm-photos': {
                    path    : 'models/photos.js',
                    requires: [ 'cache-offline'
                              , 'gallery-model-sync-yql'
                              , 'model-list'
                              , 'pnm-photo'
                              , 'yql'
                              ]
                },

                'pnm-grid-view': {
                    path    : 'views/grid.js',
                    requires: [ 'handlebars'
                              , 'node-style'
                              , 'node-screen'
                              , 'pnm-photos'
                              , 'view'
                              ]
                },

                'pnm-lightbox-view': {
                    path    : 'views/lightbox.js',
                    requires: [ 'event-key'
                              , 'handlebars'
                              , 'pnm-photos'
                              , 'transition'
                              , 'view'
                              ]
                },

                'pnm-app': {
                    path    : 'app.js',
                    requires: [ 'app-base'
                              , 'gallery-geo'
                              , 'handlebars'
                              , 'pnm-grid-view'
                              , 'pnm-lightbox-view'
                              , 'pnm-photos'
                              , 'pnm-place'
                              ]
                }
            }
        }
    }
};

// Namespace Flickr API Key.
YUI.namespace('Env.Flickr').API_KEY = FLICKR_API_KEY;

}());
