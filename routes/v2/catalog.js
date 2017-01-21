function stringToArray(str, expby) {
    var ret = new Array();
    if (str) {
        var split = str.split(expby);
        for (i = 0; i < split.length; i++) {
            ss = split[i];
            ss = ss.trim();
            if (ss.length > 0) {
                ret.push(ss);
            }
        }
    }
    return ret;
}
function getRegexString(string) {
    string = fltr_val.replace(/\[/g, '');
    string = fltr_val.replace(/\]/g, '');
    string = new RegExp(string, "i");
    return string;
}

var express = require('express');
var router = express.Router();
var _ = require('lodash');

router.all('/list', function (req, res) {
    var website_list = req.conn_website_scrap_data;
    website_list.aggregate([
        {
            $group: {
                _id: '$website', //$website is the column name in collection
                count_products: {$sum: 1},
            }
        }
    ], function (err, result) {
        if (err) {
            res.json({error: 1, message: err, data: {'websites': []}});
            next(err);
        } else {
            var websites = [];
            _.each(result, function (data) {
                var obj = {};
                obj.name = data._id;
                obj.count_products = data.count_products;
                websites.push(obj);
            })
            res.json({error: 0, message: 'success', data: {'websites': websites}});
        }
    });
});

router.all('/filters', function (req, res, next) {
    if (req.method === 'OPTIONS') {
        res.json('');
    } else {
        var is_search_filter = false;
        var search_text = req.body.search;
        if (typeof search_text != 'undefined' && search_text.length > 0) {
            is_search_filter = true;
        }
        var father_key = req.body.father_key;
        var request_filter_cat_id = req.body.cat_id;
        var request_filter_sub_cat_id = req.body.sub_cat_id;
        var filters_category_wise = req.conn_filters_category_wise;
        var is_cat_id_set = false;
        var is_sub_cat_id_set = false;
        if (typeof request_filter_cat_id != 'undefined' && request_filter_cat_id != -1) {
            is_cat_id_set = true;
        }
        if (typeof request_filter_sub_cat_id != 'undefined' && request_filter_sub_cat_id != -1) {
            is_sub_cat_id_set = true;
        }
        var applied_filters = req.body.filters;
        var is_filter_applied = false;
        if (typeof applied_filters != 'undefined' && applied_filters.length > 0) {
            is_filter_applied = true;
            Object.keys(applied_filters).forEach(function (key) {
                fltr = applied_filters[key].param;
                fltr_str_arr = stringToArray(fltr, '__');
                check = fltr_str_arr[0];
                if (check == 'filter') {
                    fltr_type = fltr_str_arr[1];
                    fltr_key = fltr_str_arr[2];
                    fltr_val = fltr_str_arr[3];
                    if (fltr_type == 'integer') {
                        if (fltr_key == 'cat_id') {
                            request_filter_cat_id = fltr_val;
                            is_cat_id_set = true;
                        }
                        if (fltr_key == 'sub_cat_id') {
                            request_filter_sub_cat_id = fltr_val;
                            is_sub_cat_id_set = true;
                        }
                    }
                }
            });
        }
        var is_father_request = false;
        if (typeof father_key != 'undefined' && father_key != '') {
            is_father_request = true;
        }
        if (!req.body.cat_id && !req.body.sub_cat_id && is_father_request == false && is_filter_applied == false) {
            res.json({
                error: 0,
                data: []
            });
            return;
        } else {
            var finalData = {};
            finalData.filters = {};


            var sortBy_arr = new Array;
            sortBy_arr.push({'text': 'Popular', 'param': 'popular', 'sort': {'sort_score': 1}});
            sortBy_arr.push({'text': 'New Arrivals', 'param': 'new', 'sort': {'is_new_insert': -1, 'time': -1}});
            sortBy_arr.push({'text': 'Price -- Low to High', 'param': 'pricelth', 'sort': {'price': 1}});
            sortBy_arr.push({'text': 'Price -- High to Low', 'param': 'pricehtl', 'sort': {'price': -1}});
            //sortBy_arr.push({'text': 'Off % -- Low to High','param': 'offlth','sort': {'offrate': 1}});
            //sortBy_arr.push({'text': 'Off % -- High to Low','param': 'offhtl','sort': {'offrate': -1}});
            sortBy_arr.push({'text': 'Price Change', 'param': 'pricechange', 'sort': {'price_diff': -1}});
            if (is_search_filter == false) {
                // if search page no need of sort
                finalData.sort = sortBy_arr; //filter
            }
            var father_wise_listing = req.recycle_data.father_wise_listing;
            var category_filters = [];
            if (is_father_request == true && is_filter_applied == false) {
                if (typeof (father_wise_listing) != 'undefined' && father_wise_listing.length > 0) {
                    for (var i = 0; i < father_wise_listing.length; i++) {
                        var chk_father_key = father_wise_listing[i].father_key;
                        if (father_key == chk_father_key && typeof father_wise_listing[i].data != 'undefined' && father_wise_listing[i].data.length > 0) {
                            for (k = 0; k < father_wise_listing[i].data.length; k++) {
                                delete father_wise_listing[i].data[k].data;
                                $p_cat_data = father_wise_listing[i].data[k];
                                $p_cat_data.text = father_wise_listing[i].data[k].name;
                                if (father_wise_listing[i].data[k].sub_cat_id != -1 && father_wise_listing[i].data[k].sub_cat_id != 1) {
                                    // for watches and sunglasses
                                    $p_cat_data.param = 'filter__integer__sub_cat_id__' + father_wise_listing[i].data[k].sub_cat_id;
                                } else {
                                    $p_cat_data.param = 'filter__integer__cat_id__' + father_wise_listing[i].data[k].cat_id;
                                }
                                category_filters.push($p_cat_data);
                            }
                        }
                    }
                }
                finalData.filters.category_filters = {
                    text: 'Category',
                    key: 'category_filter',
                    data: category_filters
                };
                res.json({
                    error: 0,
                    data: finalData,
                });
            } else if (is_cat_id_set == true && is_sub_cat_id_set == false && request_filter_sub_cat_id != -1) {
                if (typeof (father_wise_listing) != 'undefined' && father_wise_listing.length > 0) {
                    for (var i = 0; i < father_wise_listing.length; i++) {
                        if (typeof father_wise_listing[i].data != 'undefined' && father_wise_listing[i].data.length > 0) {
                            for (k = 0; k < father_wise_listing[i].data.length; k++) {
                                var chk_cat_id = father_wise_listing[i].data[k].cat_id;
                                if (chk_cat_id == request_filter_cat_id) {
                                    for (j = 0; j < father_wise_listing[i].data[k].data.length; j++) {
                                        $p_cat_data = father_wise_listing[i].data[k].data[j];
                                        $p_cat_data.text = father_wise_listing[i].data[k].data[j].name;
                                        $p_cat_data.param = 'filter__integer__sub_cat_id__' + father_wise_listing[i].data[k].data[j].sub_cat_id;
                                        category_filters.push($p_cat_data);
                                    }
                                }
                            }
                        }
                    }
                }
                finalData.filters.sub_category_filters = {
                    text: 'Sub-Category',
                    key: 'sub_category_filter',
                    data: category_filters
                };
                res.json({
                    error: 0,
                    data: finalData,
                });
            } else {
                if (is_cat_id_set == false && is_sub_cat_id_set == true) {
                    var where_filter = {
                        'sub_cat_id': request_filter_sub_cat_id * 1
                    };
                } else {
                    var where_filter = {
                        'cat_id': request_filter_cat_id * 1,
                        'sub_cat_id': request_filter_sub_cat_id * 1
                    };
                }
                filters_category_wise.where(where_filter).find(results);
                function results(err, data) {
                    if (err) {
                        next(err);
                    } else {
                        if (data.length == 0) {
                            res.json({
                                error: 0,
                                data: finalData,
                            });
                            return;
                        } else {
                            raw_filters = data[0].get('filters').api_filters;
                            if (is_search_filter == true) {
                                Object.keys(raw_filters).forEach(function (key) {
                                    if (key == 'brand' || key == 'price') {
                                    } else {
                                        delete raw_filters[key];
                                    }
                                });
                            }
                            finalData.filters = raw_filters;
                            res.json({
                                error: 0,
                                data: finalData,
                            });
                        }
                    }
                }
            }
        }
    }
});

router.all('/products', function (req, res, next) {
    var website_list = req.conn_website_scrap_data;
    var website_name = req.body.website;
    var page = req.body.page;
    var limit = req.body.limit;
    if (!page || !isNaN(page) == false || page <= 0) {
        page = 1;
    }
    if (!limit || !isNaN(limit) == false || limit <= 0) {
        limit = 30;
    }
    if (website_name) {
        website_list.find({website: website_name}).sort('-1').skip((page - 1) * limit).limit(limit).exec(function (err, results) {
            if (err) {
                res.json({error: 1, message: err, data: {'products': []}});
            } else {
                res.json({error: 0, message: 'success', data: {'products': results, nextPage: Number(page) + 1, previousPage: Number(page) - 1}});
            }
        });
    } else {
        res.json({error: 1, message: 'website name cannot be empty', data: {'products': []}});
    }
});

router.all('/search', function (req, res) {
    var website_list = req.conn_website_scrap_data;
    var website_name = req.body.website;
    var website_category = req.body.website_category;
    var page = req.body.page;
    var limit = req.body.limit;
    if (!page || !isNaN(page) == false || page <= 0) {
        page = 1;
    }
    if (!limit || !isNaN(limit) == false || limit <= 0) {
        limit = 30;
    }
    if (website_name && website_category) {
        var search_data = {website: website_name, website_category: website_category}
    } else if (website_name) {
        search_data = {website: website_name}
    } else if (website_category) {
        search_data = {website_category: website_category}
    }
    if (search_data) {
        website_list.find(search_data).sort('-1').skip((page - 1) * limit).limit(limit).exec(function (err, results) {
            if (err) {
                res.json({error: 1, message: err, data: {'products': []}});
            } else {
                website_list.aggregate([
                    {
                        $group: {
                            _id: '$website', //$website is the column name in collection
                            count_products: {$sum: 1},
                        }
                    }
                ], function (err, result) {
                    if (err) {
                        res.json({error: 1, message: err, data: {'websites': []}});
                        next(err);
                    } else {
                        var websites = [];
                        _.each(result, function (data) {
                            var obj = {};
                            obj.name = data._id;
                            obj.count_products = data.count_products;
                            websites.push(obj);
                        })
                        res.json({error: 0, message: 'success', data: {'products': results, 'websites': websites, nextPage: Number(page) + 1, previousPage: Number(page) - 1, searchText: website_category}});
                    }
                });
            }
        });
    } else {
        res.json({error: 1, message: 'website name or website category cannot be empty', data: {'products': []}});
    }
});

module.exports = router;