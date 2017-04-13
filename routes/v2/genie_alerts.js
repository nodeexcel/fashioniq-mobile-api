var express = require('express');
var fs = require('fs');
var router = express.Router();
var mongoose = require('mongoose');
var _ = require('lodash');
var moment = require('moment');
var jwt = require('jwt-simple');
var MAIL = require('../../modules/MAIL');
var GENERIC = require('../../modules/generic');
var PUSH_MESSAGE = require('../../modules/push_message');

router.all('/set_genie_alert', function(req, res, next) {
    var body = req.body;
    var website = body.website;
    var mongo_id = body.mongo_id;
    var email_id = body.email_id;
    var website_scrap_data = req.conn_website_scrap_data;
    var UserModel = req.User;
    var log_push_notification = req.log_push_notification;
    var conn_price_alerts_email_log = req.conn_price_alerts_email_log;
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
                             var current_date = moment().unix();
                            var payload = {email: email, time: current_date};
                            var secret = 'Pricegenie';
                            token_encode(payload, secret, function (token) {
                                var token_link = 'http://pricegenie.co/my_genie_alerts.php?email=' + token;
                                var from = 'noreply@pricegenie.co';
                                if (website == 'fashionq') {
                                    from = 'noreply@fashioniq.in';
                                }
                                var product_img = product.get('img');
                                var exist_product_price = product.get('price');
                                var product_url_aff = GENERIC.getAffiliateUrl(website, product.get('href'));
                                var html = '<html><head><style>td ,th{border-style: solid;border-color: grey;}</style></head><body><b>Hello</b><br><br>Greeting from Pricegenie. <br><br>Price alert starts for.<br><br><a href=' + product_url_aff + '><table style="width:100%"><tr align="center"><td colspan="4"><font size="5">' + Product_name + '</font></td></tr><tr align="center"><th rowspan="2"><img src=' + product_img + ' alt="Smiley face" height="80" width="80"></th><th>Current price</th><th rowspan="2"><button type="button" style="height:50px;width:auto">Buy now!</button></th></tr><tr align="center"><td>' + exist_product_price + '</td></tr></tr></table></a><br><br><a href="' + token_link + '">View all your Price Alerts</a></body></html>';
                                var email = email_id;
                                var subject = 'Price alert set ' + Product_name;
                                MAIL.mail_alert(email, subject, 'template', from, html, function (response_msg, response_data, response) {
                                    if (response) {
                                        if (response.accepted) {
                                            email_sent_status = 'sent';
                                        } else {
                                            email_sent_status = 'not sent';
                                        }
                                        var email_info = {
                                            email_sent_status: email_sent_status,
                                            email_sent_response: response.response,
                                            scrap_product_id: product._id,
                                            website: product.get('website'),
                                            time: moment().format(),
                                            email_id: email,
                                            current_price: exist_product_price,
                                        };
                                        var insert_email_info = new conn_price_alerts_email_log(email_info);
                                        insert_email_info.save(function (err, resp) {
                                            if (err) {
                                                console.log(err)
                                            } else {
                                                console.log(resp);
                                            }
                                        })
                                    }
                                });
                            });
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
                                            var payload = {};
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
                                        var payload = {};
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

function token_encode(payload, secret, callback) {
    if (payload && secret) {
//encode
        var token = jwt.encode(payload, secret);
        callback(token);
    } else {
        callback('');
    }
};


module.exports = router;