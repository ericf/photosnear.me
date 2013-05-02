module.exports = function exposeView(view) {
    return function (req, res, next) {
        res.view = view;
        res.expose({name: view}, 'VIEW');
        next();
    };
};
