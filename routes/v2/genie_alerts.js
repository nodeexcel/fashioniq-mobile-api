var express = require('express');
var fs = require('fs');
var router = express.Router();
var mongoose = require('mongoose');
var _ = require('lodash');

router.all('/set_genie_alert', function(req, res, next) {
    var body = req.body;
    var website = body.website;
    var mongo_id = body.mongo_id;
    var email_id = body.email_id;
    var website_scrap_data = req.conn_website_scrap_data;
    var where = {
        _id: mongoose.Types.ObjectId(mongo_id)
    };
    if (mongo_id && email_id && website) {
        website_scrap_data.find(where, function(err, product) {
            if (err) {
                res.json({ status: 0, message: err });
            } else if (!product) {
                res.json({ status: 0, message: "product not found" });
            } else {
                product = product[0];
                var email = product.get('genie_alerts');
                var check_email = _.some(email, { "email_id": email_id });
                if (check_email == false) {
                    if (product.get('genie_alerts')) {
                        var genie_alerts = email;
                    } else {
                        var genie_alerts = [];
                    }
                    genie_alerts.push({
                        website: website,
                        email_id: email_id,
                        starts_on: new Date()
                    });
                    to_be_update_data = {
                        genie_alerts: genie_alerts,
                    };
                    website_scrap_data.update(where, { '$set': to_be_update_data }, function(err, response) {
                        if (err) {
                            res.json({ error: 1, message: err });
                        } else {
                            res.json({ status: 0, message: "Price alert subscribed" });
                        }
                    });
                } else {
                    res.json({ status: 0, message: "you are already subscribed" });
                }
            }
        });
    } else {
        res.json({
            error: 0,
            message: 'Invalid Request'
        });
    }
});

router.all('/unset_genie_alert', function(req, res, next) {
    var body = req.body;
    var website = body.website;
    var mongo_id = body.mongo_id;
    var email_id = body.email_id;
    var website_scrap_data = req.conn_website_scrap_data;
    var where = {
        _id: mongoose.Types.ObjectId(mongo_id)
    };
    if (mongo_id && email_id && website) {
        website_scrap_data.find(where, function(err, product) {
            if (err) {
                res.json({ status: 0, message: err });
            } else if (!product) {
                res.json({ status: 0, message: "product not found" });
            } else {
                product = product[0];
                var email = product.get('genie_alerts');
                var check_email = _.some(email, { "email_id": email_id });
                var check_website = _.some(email, { "website": website });
                if (check_email == true && check_website == true) {
                    if (product.get('genie_alerts')) {
                        var genie_alerts = email;
                    } else {
                        var genie_alerts = [];
                    }
                    for (var i = 0; i < genie_alerts.length; i++) {
                        var obj = genie_alerts[i];
                        if (obj.email_id == email_id && obj.website == website) {
                            genie_alerts.splice(i, 1)
                        }
                    }
                    to_be_update_data = {
                        genie_alerts: genie_alerts,
                    };
                    website_scrap_data.update(where, { '$set': to_be_update_data }, function(err, response) {
                        if (err) {
                            res.json({ error: 1, message: err });
                        } else {
                            res.json({ status: 0, message: "Price alert unsubscribed" });
                        }
                    });
                } else {
                    res.json({ status: 0, message: "you are not subscribed" });
                }
            }
        });
    } else {
        res.json({
            error: 0,
            message: 'Invalid Request'
        });
    }
});

module.exports = router;
