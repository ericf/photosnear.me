YUI.add('pnm-lightbox-view', function (Y) {

var PNM       = Y.PNM,
    Templates = PNM.Templates,
    LightboxView;

LightboxView = Y.Base.create('lightboxView', Y.View, [], {

    containerTemplate: '<div class="lightbox" />',
    template         : Templates['lightbox'],

    events: {
        '.photo img': {click: 'toggleInfo'}
    },

    initializer: function () {
        this.after('photoChange', this.render);
    },

    attachEvents: function () {
        LightboxView.superclass.attachEvents.apply(this, arguments);

        var photoKeyNav = Y.one('doc').on('key', function (e) {
            if (!e.metaKey) {
                this[e.keyCode === 37 ? 'prev' : 'next']();
            }
        }, 'down:37,39', this);

        this._attachedViewEvents.push(photoKeyNav);

        return this;
    },

    render: function () {
        var photo     = this.get('photo'),
            photos    = this.get('photos'),
            container = this.get('container'),
            content, photoNode, nav, prev, next;

        if (!photos.isEmpty()) {
            nav  = {};
            prev = photos.getPrev(photo);
            next = photos.getNext(photo);

            if (prev) {
                prev.loadImg();
                nav.prev = prev;
            }

            if (next) {
                next.loadImg();
                nav.next = next;
            }
        }

        content = this.template({
            nav  : nav,
            photo: Y.merge({title: 'Photo'}, photo.getAttrs([
                'title', 'largeURL', 'pageURL'
            ]))
        });

        container.setHTML(content);

        photoNode     = container.one('.photo');
        this.infoNode = container.one('.photo-info');

        photoNode.addClass('loading');
        photo.loadImg(function () {
            // Make sure photo hasn't changed while waiting for it to load.
            if (photo === this.get('photo')) {
                photoNode.removeClass('loading');
            }
        }, this);

        return this;
    },

    toggleInfo: function (e) {
        var infoNode = this.infoNode,
            visible  = infoNode.getStyle('display') !== 'none';

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
    }

});

Y.namespace('PNM').LightboxView = LightboxView;

}, '0.9.0', {
    requires: [
        'event-key',
        'pnm-templates',
        'transition',
        'view'
    ]
});
