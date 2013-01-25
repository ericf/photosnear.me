YUI.add('pnm-grid-view', function (Y) {

var PNM       = Y.PNM,
    Templates = PNM.Templates,
    GridView;

GridView = Y.Base.create('gridView', Y.View, [], {

    containerTemplate: '<div class="grid" />',
    template         : Templates['grid'],
    photoTemplate    : Templates['grid-photo'],

    events: {
        '.photo a': {click: 'select'}
    },

    initializer: function (config) {
        var photos = this.get('photos');

        Y.one('body').plug(Y.Plugin.ScrollInfo, {scrollMargin: 250});

        this.publish('more', {preventable: false});

        photos.after('reset', this.render, this);
        photos.after('add', this.addPhoto, this);

        this.listNode = this.get('container').one('ul');

        // Only try to load more photos if we already have some photos. This
        // prevents the lazily-loaded photos from duplicating.
        if (!photos.isEmpty()) {
            Y.later(0, this, 'moreIfNeeded');
        } else {
            photos.once('load', this.moreIfNeeded, this);
        }
    },

    attachEvents: function () {
        GridView.superclass.attachEvents.apply(this, arguments);

        this._attachedViewEvents.push(
            Y.one('body').scrollInfo.on('scrollToBottom', this.more, this));

        return this;
    },

    render: function () {
        var photos    = this.get('photos'),
            container = this.get('container'),
            content;

        content = this.template({photos: photos.toJSON()}, {
            partials: {'grid-photo': this.photoTemplate}
        });

        container.setHTML(content);
        this.listNode = container.one('ul');

        return this;
    },

    addPhoto: function (e) {
        if (!this._addingPhotos) {
            this._addingPhotos = true;
            this._newPhotos    = [];

            Y.later(0, this, function () {
                this.insertPhotos(this._newPhotos);
                this._addingPhotos = false;

                // Try to load more photos, if needed.
                Y.later(0, this, 'moreIfNeeded');
            });
        }

        this._newPhotos.push(e.model);
    },

    insertPhotos: function (photos) {
        var fragment = Y.one(Y.config.doc.createDocumentFragment());

        Y.Array.each(photos, function (photo) {
            fragment.append(this.photoTemplate(photo));
        }, this);

        this.listNode.append(fragment);
    },

    more: function (e) {
        this.get('container').one('.loading').show();
        this.fire('more');
    },

    moreIfNeeded: function () {
        var body            = Y.one('body'),
            photosOffscreen = body.scrollInfo.getOffscreenNodes('.photo');

        if (photosOffscreen.isEmpty()) {
            this.more();
        }
    },

    select: function (e) {
        // Don't want to select photo if they are opening it in a new tab.
        if (e.button !== 1 || e.ctrlKey || e.metaKey) { return; }

        this.get('container').all('.photo.selected').removeClass('selected');
        e.currentTarget.ancestor('.photo').addClass('selected');
    },

    resetUI: function () {
        this.get('container').all('.photo.selected').removeClass('selected');
        this.moreIfNeeded();
        return this;
    }

});

Y.namespace('PNM').GridView = GridView;

}, '0.7.0', {
    requires: [
        'node-style',
        'node-scroll-info',
        'pnm-templates',
        'view'
    ]
});
