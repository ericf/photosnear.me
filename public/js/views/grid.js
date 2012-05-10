YUI.add('pnm-grid-view', function (Y) {

var PNM       = Y.PNM,
    Templates = PNM.Templates,
    GridView;

GridView = Y.Base.create('gridView', Y.View, [], {

    containerTemplate: '<div class="grid" />',
    template         : Templates['grid'],
    photoTemplate    : Templates['grid-photo'],

    events: {
        '.photo': {click: 'select'}
    },

    initializer: function (config) {
        var photos = this.get('photos');

        this._maxKnownHeight = 0;
        this.publish('more', {preventable: false});

        photos.after('reset', this.render, this);

        // Only try to load more photos if we already have some photos. This
        // prevents the lazily-loaded photos from duplicating.
        if (!photos.isEmpty()) {
            Y.later(1, this, 'more');
        }
    },

    attachEvents: function () {
        GridView.superclass.attachEvents.apply(this, arguments);

        this._attachedViewEvents.push(
            Y.one('win').on(['scroll', 'resize'], this.more, this));

        return this;
    },

    render: function () {
        var photos    = this.get('photos'),
            container = this.get('container'),
            content;

        content = this.template({
            photos: photos.map(function (photo) {
                return photo.getAttrs(['id', 'title', 'thumbUrl']);
            })
        }, {
            partials: {'grid-photo': this.photoTemplate}
        });

        container.setHTML(content);
        return this;
    },

    more: function (e) {
        var viewportBottom = Y.DOM.viewportRegion().bottom,
            maxKnowHeight  = this._maxKnownHeight,
            container, containerBottom;

        if (viewportBottom <= maxKnowHeight) { return; }

        container       = this.get('container');
        containerBottom = container.get('region').bottom;

        if ((viewportBottom + 150) > containerBottom && containerBottom > maxKnowHeight) {
            this._maxKnownHeight = containerBottom;
            container.one('.loading').show();
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

}, '0.5.1', {
    requires: [
        'node-style',
        'node-screen',
        'pnm-templates',
        'view'
    ]
});
