YUI.add('pnm-lightbox-view', function (Y) {

var LightboxView = Y.Base.create('lightboxView', Y.View, [], {

    containerTemplate: '<div class="lightbox" />',
    template         : Y.Handlebars.compile(Y.one('#lightbox-template').getContent()),

    events: {
        '.photo img': {click: 'toggleInfo'}
    },

    initializer: function () {
        this.after('photoChange', this.render);
    },

    // TODO: figure out a better way to do this:
    attachEvents: function () {
        LightboxView.superclass.attachEvents.apply(this, arguments);

        var photoKeyNav = Y.one('doc').on('key', function (e) {
            if (!e.metaKey) {
                this[e.keyCode === 37 ? 'prev' : 'next']();
            }
        }, 'down:37,39', this);

        this._attachedViewEvents.push(photoKeyNav);
    },

    render: function () {
        var photo     = this.get('photo'),
            photos    = this.get('photos'),
            container = this.get('container'),
            content, nav, prev, next;

        if (!photos.isEmpty()) {
            nav  = {};
            prev = photos.getPrev(photo);
            next = photos.getNext(photo);

            if (prev) {
                prev.loadImg();
                nav.prev = prev.get('id');
            }

            if (next) {
                next.loadImg();
                nav.next = next.get('id');
            }
        }

        content = this.template({
            nav  : nav,
            photo: Y.merge({title: 'Photo'}, photo.getAttrs([
                'title', 'largeUrl', 'pageUrl', 'description'
            ]))
        });

        container.setContent(content);
        this.infoNode = container.one('.photo-info');

        return this;
    },

    toggleInfo: function (e) {
        var infoNode = this.infoNode,
            visible  = !(infoNode.getStyle('display') === 'none');

        if (visible) {
            infoNode.hide('fadeOut');
        } else {
            infoNode.show('fadeIn');
        }
    },

    prev: function () {
        var photo = this.get('photos').getPrev(this.get('photo'));
        if (photo) {
            this.fire('prev', {photo: photo});
        }
    },

    next: function () {
        var photo = this.get('photos').getNext(this.get('photo'));
        if (photo) {
            this.fire('next', {photo: photo});
        }
    },

    fadeInfo: function () {
        // Fade out the photo info after 4 seconds.
        Y.later(1, this.infoNode, 'hide', ['fadeOut', {delay: 4}]);
    }
});

Y.namespace('PNM').LightboxView = LightboxView;

}, '0.4.2', {
    requires: [ 'event-key'
              , 'handlebars'
              , 'pnm-photos'
              , 'transition'
              , 'view'
              ]
});
