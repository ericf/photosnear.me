(function () {

var filter = (window.location.search.match(/[?&]filter=([^&]+)/) || [])[1] || 'min';

// YUI Config.
YUI_config = {
    comboBase  : 'http://yui.ericf.me/?',
    root       : '/',
    filter     : filter,
    combine    : filter === 'min',
    allowRollup: false,
    gallery    : 'gallery-2011.10.20-23-28',
    groups     : {
        app: {
            base     : '/js/',
            comboBase: '/js/?',
            combine  : filter === 'min',
            root     : '',
            modules  : {
                'place': {
                    path    : 'models/place.js',
                    requires: [ 'cache-offline'
                              , 'gallery-model-sync-yql'
                              , 'model'
                              , 'yql'
                              ]
                },

                'photo': {
                    path    : 'models/photo.js',
                    requires: [ 'gallery-model-sync-yql'
                              , 'cache-offline'
                              , 'model'
                              , 'place'
                              , 'yql'
                              ]
                },

                'photos': {
                    path    : 'models/photos.js',
                    requires: [ 'cache-offline'
                              , 'gallery-model-sync-yql'
                              , 'model-list'
                              , 'photo'
                              , 'yql'
                              ]
                },

                'grid-view': {
                    path    : 'views/grid.js',
                    requires: [ 'handlebars'
                              , 'node-style'
                              , 'node-screen'
                              , 'photos'
                              , 'view'
                              ]
                },

                'lightbox-view': {
                    path    : 'views/lightbox.js',
                    requires: [ 'event-key'
                              , 'handlebars'
                              , 'photos'
                              , 'view'
                              ]
                },

                'photosnearme': {
                    path    : 'photosnearme.js',
                    requires: [ 'app-base'
                              , 'gallery-geo'
                              , 'handlebars'
                              , 'place'
                              , 'photos'
                              , 'grid-view'
                              , 'lightbox-view'
                              ]
                }
            }
        }
    }
};

// Flickr API Key.
YUI && (YUI.namespace('Env.Flickr').API_KEY = '0984607e2222db7a1be6a5692741ca08');

}());
