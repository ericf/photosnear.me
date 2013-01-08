var connect = require('connect'),
    fresh   = require('fresh');

module.exports = function (req, res, next) {
    if (connect.utils.conditionalGET(req) && fresh(req, res)) {
        return connect.utils.notModified(res);
    }

    res.send(res.body, 200);
};
