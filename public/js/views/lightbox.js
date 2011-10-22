YUI.add('lightbox-view', function (Y) {

Y.LightboxView = Y.Base.create('lightboxView', Y.View, [], {

    template: Handlebars.compile(Y.one('#lightbox-template').getContent()),

    render: function () {
        var photo  = this.get('model'),
            photos = this.get('modelList'),
            place  = this.get('place'),
            content, nav, prev, next;

        if (!photos.isEmpty()) {
            nav  = {};
            prev = photos.getPrev(photo);
            next = photos.getNext(photo);

            prev && (nav.prev = '../' + prev.get('id') + '/');
            next && (nav.next = '../' + next.get('id') + '/');
        }

        content = this.template({
            placeId    : place.get('id'),
            placeText  : place.toString(),
            title      : photo.get('title') || 'Photo',
            description: photo.get('description') || '',
            largeUrl   : photo.get('largeUrl'),
            nav        : nav
        });

        this.loadImg(function () {
            this.get('container').setContent(content);
        });

        return this;
    },

    loadImg: function (callback) {
        // Insired by: Lucas Smith
        // (http://lucassmith.name/2008/11/is-my-image-loaded.html)
        var img  = new Image(),
            prop = img.naturalWidth ? 'naturalWidth' : 'width';

        img.src = this.get('model').get('largeUrl');

        if (img.complete) {
            callback.call(this, img[prop] ? img : null);
        } else {
            img.onload  = Y.bind(callback, this, img);
            img.onerror = Y.bind(callback, this, null);
        }
    }

}, {

    ATTRS: {
        container: {
            valueFn: function () {
                return Y.Node.create('<div id="lightbox" />');
            }
        },

        place : {}
    }

});

}, '0.3.2', {
    requires: [ 'photos'
              , 'place'
              , 'view'
              ]
});
