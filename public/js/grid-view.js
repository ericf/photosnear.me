YUI.add('grid-view', function (Y) {

Y.GridView = Y.Base.create('gridView', Y.View, [], {

    container    : '<div id="photos" />',
    template     : Handlebars.compile(Y.one('#grid-template').getContent()),
    photoTemplate: Handlebars.compile(Y.one('#grid-photo-template').getContent()),
    events       : {
        '.photo': { 'click': 'select' }
    },

    initializer: function (config) {
        config || (config = {});

        var photos = this.photos = config.photos;
        photos.after('reset', this.render, this);
        photos.after('add', this.addPhoto, this);
        photos.after('remove', this.removePhoto, this);
        photos.after(['add', 'remove'], this.updateSize, this);

        this.loadingNode = null;

        this.publish({
            more  : { preventable: false },
            select: { preventable: false }
        });

        this._maxKnownHeight = 0;

        Y.one('win').on(['scroll', 'resize'], this.more, this);
    },

    render: function () {
        var photos = this.photos,
            size   = photos.size();

        this.container.setContent(this.template({
            photos: photos.toJSON(),
            size  : size
        }, {
            partials: { photo: this.photoTemplate }
        }));

        this.loadingNode = this.container.one('.loading');

        return this;
    },

    addPhoto: function (e) {
        var container = this.container,
            content   = this.photoTemplate(e.model.toJSON()),
            list      = container.one('ul');

        this.loadingNode.hide();
        list.insert(content, list.all('.photo').item(e.index));
    },

    removePhoto: function (e) {
        this.container.all('.photo').splice(e.index, 1);
    },

    updateSize: function (e) {
        this.container.one('.size').set('text', this.photos.size());
    },

    more: function (e) {
        var viewportBottom = Y.DOM.viewportRegion().bottom,
            maxKnowHeight  = this._maxKnownHeight,
            containerBottom;

        if (viewportBottom <= maxKnowHeight) { return; }

        containerBottom = this.container.get('region').bottom;

        if ((viewportBottom + 150) > containerBottom && containerBottom > maxKnowHeight) {
            this._maxKnownHeight = containerBottom;
            this.loadingNode.show();
            this.fire('more');
        }
    },

    select: function (e) {
        e.preventDefault();

        var photoNode  = e.currentTarget,
            photoNodes = this.container.all('.photo'),
            index      = photoNodes.indexOf(photoNode);

        photoNodes.removeClass('selected');
        photoNode.addClass('selected');

        this.fire('select', { photo: this.photos.item(index) });
    },

    reset: function () {
        this._maxKnownHeight = 0;
        this.container.all('.photo.selected').removeClass('selected');
    }

});

}, '0.3.2', {
    requires: [ 'view'
              , 'node-style'
              , 'node-screen'
              , 'photos'
              ]
});
