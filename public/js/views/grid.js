YUI.add('pnm-grid-view', function (Y) {

var GridView = Y.Base.create('gridView', Y.View, [], {

    containerTemplate: '<div class="grid" />',
    template         : Y.Handlebars.compile(Y.one('#grid-template').getContent()),
    photoTemplate    : Y.Handlebars.compile(Y.one('#grid-photo-template').getContent()),

    events: {
        '.photo': {click: 'select'}
    },

    initializer: function (config) {
        var photos = this.get('photos');

        photos.after('reset', this.render, this);

        this.loadingNode     = null;
        this._maxKnownHeight = 0;

        this.publish('more', {preventable: false});

        Y.one('win').on(['scroll', 'resize'], this.more, this);
    },

    render: function () {
        var photos    = this.get('photos'),
            container = this.get('container'),
            content;

        content = this.template({
            photos: photos.map(function (photo) {
                return photo.getAttrs(['id', 'clientId', 'thumbUrl']);
            })
        }, {
            partials: {photo: this.photoTemplate}
        });

        container.setContent(content);
        this.loadingNode = container.one('.loading');

        // Only try to load more photos if we already have some photos. This
        // prevents the lazily-loaded photos from duplicating.
        if (!photos.isEmpty()) {
            Y.later(1, this, 'more');
        }

        return this;
    },

    more: function (e) {
        var viewportBottom = Y.DOM.viewportRegion().bottom,
            maxKnowHeight  = this._maxKnownHeight,
            containerBottom;

        if (viewportBottom <= maxKnowHeight) { return; }

        containerBottom = this.get('container').get('region').bottom;

        if ((viewportBottom + 150) > containerBottom && containerBottom > maxKnowHeight) {
            this._maxKnownHeight = containerBottom;
            this.loadingNode.show();
            this.fire('more');
        }
    },

    select: function (e) {
        this.get('container').all('.photo.selected').removeClass('selected');
        e.currentTarget.addClass('selected');
    },

    reset: function () {
        this._maxKnownHeight = 0;
        this.get('container').all('.photo.selected').removeClass('selected');
        return this;
    }

});

Y.namespace('PNM').GridView = GridView;

}, '0.4.2', {
    requires: [ 'handlebars'
              , 'node-style'
              , 'node-screen'
              , 'pnm-photos'
              , 'view'
              ]
});
