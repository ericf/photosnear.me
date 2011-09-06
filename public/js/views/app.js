YUI.add('app-view', function (Y) {

var Lang       = Y.Lang,
    isFunction = Lang.isFunction;

Y.AppView = Y.Base.create('appView', Y.View, [], {

    container     : Y.one('#wrap'),
    titleTemplate : Handlebars.compile(Y.one('#title-template').getContent()),
    headerTemplate: Handlebars.compile(Y.one('#header-template').getContent()),

    initializer: function (config) {
        config || (config = {});

        this.place = config.place;
        this.place.after('change', this.render, this);

        this.after('pageViewChange', function (e) {
            this.transitionPageView(e.newVal, e.prevVal, e.callback);
        });
    },

    render: function () {
        var place     = this.place,
            placeText = place.toString(),
            pageView  = this.get('pageView'),
            container = this.container;

        Y.config.doc.title = this.titleTemplate({ place: placeText });

        container.removeClass('loading')
            .one('#header').setContent(this.headerTemplate({place: placeText}));

        if ( ! place.isNew()) {
            // Delays the addition of the CSS class until after render.
            Y.later(1, container, 'addClass', 'located');
        }

        if (pageView) {
            this.transitionPageView(pageView);
        }

        return this;
    },

    transitionPageView: function (newView, oldView, callback) {
        var main = this.container.one('#main');

        // Allow callback as second arg.
        if (isFunction(oldView)) {
            callback = oldView;
            oldView  = null;
        }

        function transitionIn () {
            main.setStyle('opacity', 0)
                .setContent(newView.container)
                .show('fadeIn', { duration: 0.25 },
                    isFunction(callback) && callback);
        }

        if (oldView) {
            main.hide('fadeOut', { duration: 0.25 }, function () {
                oldView.remove();
                transitionIn();
            });
        } else {
            transitionIn();
        }
    },

    hideUrlBar: Y.UA.ios && ! Y.UA.ipad ? function () {
        Y.later(1, Y.config.win, 'scrollTo', [0, 1]);
    } : function () {}

}, {
    ATTRS: {
        pageView: {}
    }
});

}, '0.3.2', {
    requires: [ 'view'
              , 'transition'
              , 'place'
              ]
});
