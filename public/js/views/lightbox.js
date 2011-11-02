YUI.add('lightbox-view', function (Y) {

Y.LightboxView = Y.Base.create('lightboxView', Y.View, [], {

    template: Y.Handlebars.compile(Y.one('#lightbox-template').getContent()),

    initializer: function () {
        this.after('modelChange', this.render);
    },

    create: function (container) {
        return Y.Node.create('<div id="lightbox" />');
    },

    attachEvents: function () {
        Y.LightboxView.superclass.attachEvents.apply(this, arguments);

        var photoKeyNav = Y.one('doc').on('key', function (e) {
            if (!e.metaKey) {
                this[e.keyCode === 37 ? 'prev' : 'next']();
            }
        }, 'down:37,39', this);

        this._attachedViewEvents.push(photoKeyNav);
    },

    render: function () {
        var photo  = this.get('model'),
            photos = this.get('modelList'),
            content, nav, prev, next;

        if (!photos.isEmpty()) {
            nav  = {};
            prev = photos.getPrev(photo);
            next = photos.getNext(photo);

            if (prev) {
                prev.loadImg();
                nav.prev = '../' + prev.get('id') + '/';
            }

            if (next) {
                next.loadImg();
                nav.next = '../' + next.get('id') + '/';
            }

            nav.both = !!prev && !!next;
        }

        content = this.template({
            photo: {
                title   : photo.get('title') || 'Photo',
                largeUrl: photo.get('largeUrl'),
                pageUrl : photo.get('pageUrl')
            },

            nav: nav
        });

        this.get('container').setContent(content);
        return this;
    },

    prev: function () {
        var photo = this.get('modelList').getPrev(this.get('model'));
        if (photo) {
            this.fire('prev', {photo: photo});
        }
    },

    next: function () {
        var photo = this.get('modelList').getNext(this.get('model'));
        if (photo) {
            this.fire('next', {photo: photo});
        }
    }
});

}, '0.3.2', {
    requires: [ 'event-key'
              , 'handlebars'
              , 'photos'
              , 'view'
              ]
});
