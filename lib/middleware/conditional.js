var connect = require('connect');

module.exports = function (req, res, next) {
    if (connect.utils.conditionalGET(req)) {
        if (!connect.utils.modified(req, res)) {
            return connect.utils.notModified(res);
        }
    }

    res.send(res.body, 200);
};
