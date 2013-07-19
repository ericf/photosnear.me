YUI.add('pnm-helpers', function (Y) {

var regexPathParam = /([:*])([\w\-]+)?/g;

Y.namespace('PNM').Helpers = {
    pathTo: function (routeName, context) {
        context || (context = this);

        var route = PNM.ROUTES[routeName],
            path, keys;

        if (!route) { return ''; }

        path = route.path;
        keys = Y.Array.map(route.keys, function (key) { return key.name; });

        if (context && keys.length) {
            if (context._isYUIModel) {
                context = context.getAttrs(keys);
            }

            Y.Array.each(keys, function (key) {
                var regex = new RegExp('[:*]' + key + '\\b');
                path = path.replace(regex, context[key]);
            });
        }

        // Replace missing params with empty strings.
        return path.replace(regexPathParam, '');
    }
};

Y.Handlebars.registerHelper('pathTo', Y.PNM.Helpers.pathTo);

}, '0.9.0', {
    requires: [
        'handlebars-base',
        'array-extras'
    ]
});
