(function () {

var filter = (window.location.search.match(/[?&]filter=([^&]+)/) || [])[1] || 'min';

// YUI Config.
YUI_config = {
    filter     : filter,
    combine    : filter === 'min',
    allowRollup: false,
    gallery    : 'gallery-2011.08.31-20-57',
    groups     : {
        app: {
            base     : '/js/',
            comboBase: '/js/?',
            combine  : filter === 'min',
            root     : '',
            modules  : {
                'place': {
                    path    : 'models/place.js',
                    requires: [ 'model'
                              , 'yql'
                              , 'gallery-model-sync-yql'
                              , 'cache-offline'
                              ]
                },

                'photo': {
                    path    : 'models/photo.js',
                    requires: [ 'model'
                              , 'yql'
                              , 'gallery-model-sync-yql'
                              , 'cache-offline'
                              , 'place'
                              ]
                },

                'photos': {
                    path    : 'models/photos.js',
                    requires: [ 'model-list'
                              , 'yql'
                              , 'gallery-model-sync-yql'
                              , 'cache-offline'
                              , 'photo'
                              ]
                },

                'grid-view': {
                    path    : 'views/grid.js',
                    requires: [ 'view'
                              , 'node-style'
                              , 'node-screen'
                              , 'photos'
                              ]
                },

                'lightbox-view': {
                    path    : 'views/lightbox.js',
                    requires: [ 'view'
                              , 'place'
                              , 'photos'
                              ]
                },

                'app-view': {
                    path    : 'views/app.js',
                    requires: [ 'view'
                              , 'transition'
                              , 'place'
                              ]
                },

                'photosnearme': {
                    path    : 'photosnearme.js',
                    requires: [ 'controller'
                              , 'gallery-geo'
                              , 'place'
                              , 'photos'
                              , 'app-view'
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
