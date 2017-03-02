var express = require('express');
var fs = require('fs');
var router = express.Router();
var mongoose = require('mongoose');
var _ = require('lodash');
var PUSH_MESSAGE = require('../../modules/push_message');

router.all('/set_genie_alert', function(req, res, next) {
    var body = req.body;
    var website = body.website;
    var mongo_id = body.mongo_id;
    var email_id = body.email_id;
    var website_scrap_data = req.conn_website_scrap_data;
    var UserModel = req.User;
    var log_push_notification = req.log_push_notification;
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
                var Product_name = product.get('name');
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
                            UserModel.findOne({ email: email_id }, function(err, user) {
                                if (err) {
                                    console.log(err);
                                } else if (!user) {
                                    console.log('not found');
                                } else {
                                    req.GCM.findOne({ user_id: user._id.toString() }, function(error, resp) {
                                        if (error) {
                                            console.log(err)
                                        } else if (!resp) {
                                            console.log('not found');
                                        } else if (!resp.get('reg_id') && resp.get('token') == null) {
                                            console.log('token null');
                                        } else {
                                            if (resp.get('reg_id')) {
                                                var push_token = resp.get('reg_id');
                                            } else {
                                                var push_token = resp.get('token');
                                            }
                                            var payload = { product_id: product._id };
                                            var notify = {
                                                title: 'Price alert subscribed',
                                                body: 'Price alert subscribed for ' + Product_name,
                                                click_action: "FCM_PLUGIN_ACTIVITY",
                                                "color": "#f95b2c"
                                            };
                                            PUSH_MESSAGE.push_notification(push_token, payload, notify, function(error, response) {
                                                if (error == 'error') {
                                                    console.log(response);
                                                } else {
                                                    var parse_response = JSON.parse(response);
                                                    if (parse_response.success == 1) {
                                                        push_sent_status = 'sent';
                                                    } else {
                                                        push_sent_status = 'not sent';
                                                    }
                                                    var push_info = {
                                                        push_sent_status: push_sent_status,
                                                        push_sent_response: response,
                                                        scrap_product_id: product._id,
                                                        website: product.get('website'),
                                                        time: new Date(),
                                                        email_id: email_id,
                                                        genie_alerts: 'subscribed'
                                                    };
                                                    var insert_push_info = new log_push_notification(push_info);
                                                    insert_push_info.save(function(err, resp) {
                                                        if (err) {
                                                            console.log(err)
                                                        } else {
                                                            console.log(resp);
                                                        }
                                                    })
                                                }
                                            });
                                        }
                                    })
                                }
                            })
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
    var mongo_id = body.mongo_id;
    var email_id = body.email_id;
    var UserModel = req.User;
    var website_scrap_data = req.conn_website_scrap_data;
    var log_push_notification = req.log_push_notification;
    var where = {
        _id: mongoose.Types.ObjectId(mongo_id)
    };
    if (email_id) {
        website_scrap_data.update(where, { $pull: { 'genie_alerts': { email_id: email_id } } }, function(err, response) {
            if (err) {
                res.json({ error: 1, message: err });
            } else if (response == 1) {
                website_scrap_data.find(where, function(err, result) {
                    if (err) {
                        console.log(err);
                    } else if (result.length == 0) {
                        console.log('product not exist');
                    } else {
                        exist_product = result[0];
                        var Product_name = exist_product.get('name');
                        UserModel.findOne({ email: email_id }, function(err, user) {
                            if (err) {
                                console.log(err);
                            } else if (!user) {
                                console.log('not found');
                            } else {
                                req.GCM.findOne({ user_id: user._id.toString() }, function(error, resp) {
                                    if (error) {
                                        console.log(err)
                                    } else if (!resp) {
                                        console.log('not found');
                                    } else if (!resp.get('reg_id') && resp.get('token') == null) {
                                        console.log('token null');
                                    } else {
                                        if (resp.get('reg_id')) {
                                            var push_token = resp.get('reg_id');
                                        } else {
                                            var push_token = resp.get('token');
                                        }
                                        var payload = { product_id: exist_product._id };
                                        var notify = {
                                            title: 'Price alert unsubscribed',
                                            body: 'Price alert unsubscribed for ' + Product_name,
                                            click_action: "FCM_PLUGIN_ACTIVITY",
                                            "color": "#f95b2c"
                                        };
                                        PUSH_MESSAGE.push_notification(push_token, payload, notify, function(error, response) {
                                            if (error == 'error') {
                                                console.log(response);
                                            } else {
                                                var parse_response = JSON.parse(response);
                                                if (parse_response.success == 1) {
                                                    push_sent_status = 'sent';
                                                } else {
                                                    push_sent_status = 'not sent';
                                                }
                                                var push_info = {
                                                    push_sent_status: push_sent_status,
                                                    push_sent_response: response,
                                                    scrap_product_id: exist_product._id,
                                                    website: exist_product.get('website'),
                                                    time: new Date(),
                                                    email_id: email_id,
                                                    genie_alerts: 'unsubscribed'
                                                };
                                                var insert_push_info = new log_push_notification(push_info);
                                                insert_push_info.save(function(err, resp) {
                                                    if (err) {
                                                        console.log(err)
                                                    } else {
                                                        console.log(resp);
                                                    }
                                                })
                                            }
                                        });
                                    }
                                })
                            }
                        })
                    }
                });
                res.json({ status: 0, message: "Price alert unsubscribed" });
            } else {
                res.json({ status: 0, message: "product not found" });
            }
        });
    } else {
        res.json({ error: 0, message: 'Invalid Request' });
    }
});

module.exports = router;
