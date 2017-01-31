var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var moment = require('moment');

function stringToArray(str, expby) {
    var ret = new Array();
    var split = str.split(expby);
    for (i = 0; i < split.length; i++) {
        ss = split[i];
        ss = ss.trim();
        if (ss.length > 0) {
            ret.push(ss);
        }
    }
    return ret;
}
function arrayToString(arr, impby) {
    return arr.join(impby);
}

function modifyPriceHistoryForJson(data) {
    var return_data = [];
    for (var i = 0; i < data.length; i++) {
        var rr = data[i];
        var rr_time = rr['date'];
        rr['date1'] = moment(rr_time).format("Do MMM");               // Jan 30th
        return_data.push(rr);
    }
    return return_data;
}
function manipulateVariantData(data) {
    var per_website = 4;
    var ret_data = [];
    var websites_wise = {};
    if (typeof data != 'undefined' && data.length > 0) {
        for (var i = 0; i < data.length; i++) {
            var web_exists = false;
            var row = data[i];
            var website = row.get('website');
            Object.keys(websites_wise).forEach(function (cc) {
                if (cc == website) {
                    web_exists = true;
                }
            });
            if (web_exists == false) {
                websites_wise[website] = 0;
            }
            if (websites_wise[website] < per_website) {
                ret_data.push(row);
            }
            websites_wise[website] += 1;
        }
    }
    if (ret_data.length > 0) {
        ret_data.sort(function (a, b) {
            return a.sort_score - b.sort_score;
        });
    }

    return ret_data;
}

router.all('/view', function (req, res, next) {
    if (req.method === 'OPTIONS') {
        res.json('');
    } else {
        var body = req.body;
        var productObj = req.productObj;
        var product_id = body.product_id;
        var website_scrap_data = req.conn_website_scrap_data;
        if (product_id) {
            if (typeof product_id === 'undefined') {
                res.json({
                    error: 1,
                    message: 'product_id is not found',
                });
            } else {
                var similar_arr = [];
                var variant_arr = [];
                var price_history_data = [];
                var product_data = {
                    product: {},
                    similar: similar_arr,
                    variant: variant_arr,
                };
                var product_data_list = req.config.product_data_list;
                website_scrap_data.findOneAndUpdate({_id: product_id}, {$inc: {count_views: 1}},
                // {select:product_data_list},
                        function (err, data) {
                            if (err) {
                                next(err);
                            } else {
                                if (data == null || data.length == 0) {
                                    res.json({
                                        error: 1,
                                        message: 'product not found for product_id ' + product_id,
                                    });
                                } else {
                                    var is_model_no_product = false;
                                    product_name = data.get('name');
                                    product_website = data.get('website');
                                    product_brand = data.get('brand');
                                    product_model_no = '';
                                    if (typeof data.get('model_no') != 'undefined' && data.get('model_no') != '') {
                                        product_model_no = data.get('model_no');
                                        is_model_no_product = true;
                                        console.log(' product_model_no found :: ' + product_model_no);
                                    }
                                    data.set('brand_filter_key', '');
                                    data.set('website_filter_key', '');
                                    data.set('price_drop', 0);
                                    data.set('price_history_new', []);
                                    if (typeof product_brand != 'undefined' && product_brand != '') {
                                        var brand1 = stringToArray(product_brand, ' ');
                                        var brand2 = arrayToString(brand1, '_');
                                        data.set('brand_filter_key', 'filter__text__brand__' + brand2);
                                    }
                                    if (typeof product_website != 'undefined' && product_website != '') {
                                        var website1 = stringToArray(product_website, ' ');
                                        var website2 = arrayToString(website1, '_');
                                        data.set('website_filter_key', 'filter__text__website__' + website2);
                                    }
                                    product_price_diff = data.get('price_diff');
                                    if (typeof product_price_diff != 'undefined') {
                                        data.set('price_drop', product_price_diff);
                                    }
                                    product_price_history = data.get('price_history');
                                    if (typeof product_price_history != 'undefined' && product_price_history != null && product_price_history.length > 0) {
                                        data.set('price_history_new', modifyPriceHistoryForJson(product_price_history));
                                    }
                                    product_data.product = productObj.getProductPermit(req, data);
                                    res.json({error: 0, message: 'success', data: product_data});
                                }
                            }
                        })
            }
        } else {
            res.json({error: 0, message: 'product_id cannot be empty', data: {product: {}}});
        }
    }
});

router.all('/similar', function (req, res, next) {
    var body = req.body;
    var product_id = body.product_id;
    var unique = body.unique;
    var website = body.website;
    var productObj = req.productObj;
    var website_scrap_data = req.conn_website_scrap_data;
    if (product_id || unique && website) {
        var similar_arr = [];
        if (product_id) {
            var where = {
                '_id': mongoose.Types.ObjectId(product_id)
            };
        } else {
            var where = {
                'unique': unique,
                website: website
            };
        }
        var product_data_list = req.config.product_data_list;
        website_scrap_data.where(where).select(product_data_list).findOne(result);
        function result(err, data) {
            if (err) {
                next(err);
            } else {
                if (data == null || data.length == 0) {
                    res.json({
                        error: 0,
                        data: {products: []},
                        message: 'product not found for product_id ' + product_id,
                    });
                } else {
                    var is_model_no_product = false;
                    product_name = data.get('name');
                    product_website = data.get('website');
                    if (product_name) {
                        var split_name = product_name.split(' ');
                        product_name = split_name.slice(0, 2).join(" ");
                    }
                    if (product_website && product_name) {
                        website_scrap_data.find({
                            website: product_website,
                            _id: {'$nin': [mongoose.Types.ObjectId(product_id)]},
                            'name': {'$regex': new RegExp(product_name, "i")}
                        }, {"score": {"$meta": "textScore"}}, {
                            limit: 10,
                            sort: {'score': {'$meta': "textScore"}},
                            select: product_data_list
                        }).sort({'score': {'$meta': "textScore"}}).exec(function (err, data) {
                            if (err) {
                                next(err);
                            } else {
                                console.log('data found similar');
                                data_sim_res(err, data)
                            }
                        });
                        function data_sim_res(err, data_sim) {
                            if (err) {
                                next(err);
                            } else {
                                if (data_sim) {
                                    for (var i = 0; i < data_sim.length; i++) {
                                        var row = data_sim[i];
                                        var obj = row;
                                        similar_arr.push(productObj.getProductPermit(req, obj));
                                    }
                                }
                                res.json({
                                    error: 0,
                                    message: 'success',
                                    data: {products: [similar_arr]}
                                });
                            }
                        }
                    } else {
                        res.json({error: 1, message: 'product_website and product_name cannot be empty', data: {products: []}});
                    }
                }
            }
        }
    } else {
        res.json({error: 1, message: 'product_id or unique and website cannot be empty', data: {products: []}});
    }
});

router.all('/variant', function (req, res, next) {
    var body = req.body;
    var product_id = body.product_id;
    var productObj = req.productObj;
    var website_scrap_data = req.conn_website_scrap_data;
    if (product_id) {
        var variant_arr = [];
        var where = {
            '_id': mongoose.Types.ObjectId(product_id),
        };
        var product_data_list = req.config.product_data_list;
        website_scrap_data.where(where).select(product_data_list).findOne(result);
        function result(err, data) {
            if (err) {
                next(err);
            } else {
                if (data == null || data.length == 0) {
                    res.json({
                        error: 1,
                        message: 'product not found for product_id ' + product_id,
                        data: []
                    });
                } else {
                    var is_model_no_product = false;
                    product_name = data.get('name');
                    product_website = data.get('website');
                    if (product_name) {
                        var split_name = product_name.split(' ');
                        product_name = split_name.slice(0, 2).join(" ");
                    }
                    if (product_website && product_name) {
                        website_scrap_data.find({
                            website: {'$ne': product_website},
                            _id: {'$nin': [mongoose.Types.ObjectId(product_id)]},
                            'name': {'$regex': new RegExp(product_name, "i")}
                        }, {"score": {"$meta": "textScore"}}, {
                            limit: 500,
                            sort: {'score': {'$meta': "textScore"}},
                            select: product_data_list
                        }).sort({'score': {'$meta': "textScore"}}).exec(function (err, data) {
                            if (err) {
                                next(err);
                            } else {
                                data_var_res(err, data)
                            }
                        });
                        function data_var_res(err, data_var) {
                            if (err) {
                                next(err);
                            } else {
                                for (var i = 0; i < data_var.length; i++) {
                                    var row = data_var[i];
                                    var obj = row;
                                    variant_arr.push(productObj.getProductPermit(req, obj));
                                }
                                res.json({
                                    error: 0,
                                    message: 'success',
                                    data: manipulateVariantData(variant_arr),
                                });
                            }
                        }
                    } else {
                        res.json({error: 1, message: 'product_website and product_name cannot be empty', data: []});
                    }
                }
            }
        }
    } else {
        res.json({error: 1, message: 'product_id cannot be empty', data: []});
    }
});

router.post('/like', function (req, res) {
    var body = req.body;
    var product_id = body.product_id;
    var website_scrap_data = req.conn_website_scrap_data;
    if (product_id) {
        website_scrap_data.findOneAndUpdate({_id: product_id}, {$inc: {count_likes: 1}}, function (err, product1) {
            if (err) {
                res.json({error: 1, message: err, data: []});
            } else {
                res.json({error: 0, message: 'success', data: {count_likes: product1.toJSON().count_likes}});
            }
        });
    } else {
        res.json({error: 1, message: 'product_id cannot be empty', data: []});
    }
});

module.exports = router;