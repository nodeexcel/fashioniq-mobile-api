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
        console.log('sdsdf')
        res.json({error: 1, message: 'website name cannot be empty', data: {'products': []}});
    }
});

router.all('/search', function (req, res) {
    var mongoose = req.mongoose;
    var body = req.body;
    var search_text = body.search;
    var father_key = body.father_key;
    var current_page = body.page;
    var products_per_page = req.config.products_per_page;
    if (typeof current_page === 'undefined' || current_page == -1) {
        current_page = 1;
    }
    var skip_count = (current_page - 1) * products_per_page;

    console.log('current_page :: ' + current_page);
    console.log('skip :: ' + skip_count);

    var where = {};

    var is_cat_sub_cat_search = false;
    var search_cat_id = body.cat_id;
    var search_sub_cat_id = body.sub_cat_id;

    //search_cat_id = 30;
    //search_sub_cat_id = 3003;
    var is_cat_id_set = false;
    var is_sub_cat_id_set = false;
    if (typeof search_cat_id != 'undefined' && search_cat_id != -1) {
        where = {
            'cat_id': search_cat_id * 1,
        };
        is_cat_id_set = true;
    }
    if (typeof search_sub_cat_id != 'undefined' && search_sub_cat_id != -1) {
        where = {
            'sub_cat_id': search_sub_cat_id * 1,
        };
        is_sub_cat_id_set = true;
    }

    if (is_cat_id_set == true || is_sub_cat_id_set == true) {
        is_cat_sub_cat_search = true;
    }



    var all_cat_id_found = false;
    var father_wise_listing = req.recycle_data.father_wise_listing;
    if (typeof father_key != 'undefined' && father_key != '' && is_cat_sub_cat_search == false) {
        console.log(father_key + ' :: ');
        if (typeof (father_wise_listing) != 'undefined' && father_wise_listing.length > 0) {
            for (var i = 0; i < father_wise_listing.length; i++) {
                var chk_father_key = father_wise_listing[i].father_key;
                console.log(chk_father_key + ' :: ' + father_key);
                if (father_key == chk_father_key) {
                    console.log('yes found => ' + chk_father_key + ' :: ' + father_key);
                    var father_all_cat_id = father_wise_listing[i].all_cat_id;
                    console.log(father_all_cat_id);
                    if (typeof father_all_cat_id != 'undefined' && father_all_cat_id.length > 0) {
                        all_cat_id_found = true;
                        where = {
                            'cat_id': {
                                '$in': father_wise_listing[i].all_cat_id,
                            }
                        };
                    }
                }
            }
        }
    }

    var applied_filters = body.filters;
    console.log('!!! applied filtere !!!');
    console.log(applied_filters);
    if (typeof applied_filters != 'undefined' && applied_filters.length > 0) {
        Object.keys(applied_filters).forEach(function (key) {
            fltr = applied_filters[key].param;
            console.log(fltr);
            fltr_str_arr = stringToArray(fltr, '__');
            check = fltr_str_arr[0];
            if (check == 'filter') {
                fltr_type = fltr_str_arr[1];
                fltr_key = fltr_str_arr[2];
                fltr_val = fltr_str_arr[3];
                if (fltr_type == 'text') {
                    fltr_val = fltr_val.replace(/_/g, ' ');
                    if (fltr_key == 'brand' || fltr_key == 'website' || fltr_key == 'sizes') {
                        fltr_key_is_in_where = false;
                        Object.keys(where).forEach(function (cc) {
                            if (cc == fltr_key) {
                                fltr_key_is_in_where = true;
                            }
                        });
                        if (fltr_key_is_in_where == false) {
                            where[fltr_key] = {
                                '$in': [],
                            };
                        }
                        if (fltr_key == 'sizes') {
                            if (typeof sizes_data != 'undefined' && sizes_data.length > 0) {
                                Object.keys(sizes_data).forEach(function (ss_size) {
                                    size_detail = sizes_data[ss_size];
                                    size_detail_text = size_detail.text;
                                    if (fltr_val == size_detail_text) {
                                        var size_query_params = size_detail.query_params;
                                        if (typeof size_query_params != 'undefined' && size_query_params.length > 0) {
                                            for (var jj = 0; jj < size_query_params.length; jj++) {
                                                var s_size = size_query_params[jj];
                                                s_size = new RegExp(s_size, 'i');
                                                where[fltr_key]['$in'].push(s_size);
                                            }
                                        }
                                    }
                                });
                            }
                        } else {
                            fltr_val = new RegExp(fltr_val, 'i');
                            console.log(fltr_val);
                            where[fltr_key]['$in'].push(fltr_val);
                        }
                    } else if (fltr_key == 'color') {
                        color_filter_is_set = true;
                        var query_colors = [];
                        query_colors.push(fltr_val);

                        if (typeof fltr_str_arr[3] != 'undefined' && fltr_str_arr[4] == 'subcolor') {
                            set_empty_colors_filters = true;
                            console.log(' arun kuma COLORS UNSET HERE');
                            if (typeof fltr_str_arr[5] != 'undefined') {

                                var list_sub_colors = fltr_str_arr[5];
                                list_sub_colors = list_sub_colors.replace(/_/g, ' ');
                                var arr_sub_colors = stringToArray(list_sub_colors, ',');
                                for (var i = 0; i < arr_sub_colors.length; i++) {
                                    var subclr = arr_sub_colors[i];
                                    query_colors.push(subclr);
                                }
                                //console.log(list_sub_colors);
                                //console.log('arun kumar');
                                //console.log(arr_sub_colors);
                            }
                        } else {

                            //where[fltr_key] = new RegExp(fltr_val, "i");
                            Object.keys(colors_data).forEach(function (sscc) {
                                sscc_data = colors_data[sscc];
                                sscc_color = sscc_data.color;
                                sscc_data_secondary_colors = sscc_data.secondary_colors;
                                if (sscc_color == fltr_val) {
                                    //console.log('aa :: ' +fltr_key);
                                    //console.log(fltr_val);
                                    filters.color.data = sscc_data_secondary_colors;
                                    console.log(' arun kuma COLORS SET HERE');
                                    for (var i = 0; i < sscc_data_secondary_colors.length; i++) {
                                        var row = sscc_data_secondary_colors[i];
                                        query_colors.push(row.color);
                                        if (typeof row.sub_colors != 'undefined' && row.sub_colors.length > 0) {
                                            for (var j = 0; j < row.sub_colors.length; j++) {
                                                var rowss = row.sub_colors[j];
                                                query_colors.push(getRegexString(rowss));
                                            }
                                        }
                                    }
                                }
                            });

                        }

                        console.log('query_colors');
                        console.log(query_colors);


                        where[fltr_key] = {
                            '$in': query_colors
                        };

                    } else {
                        where[fltr_key] = new RegExp(fltr_val, "i");
                    }

                } else if (fltr_type == 'range') {
                    range_arr = stringToArray(fltr_val, '_');
                    fltr_val_low = range_arr[0];
                    fltr_val_high = range_arr[1];
                    where[fltr_key] = {
                        '$gte': fltr_val_low * 1,
                        '$lte': fltr_val_high * 1
                    };
                } else if (fltr_type == 'integer') {
                    console.log('yahan par hai');
                    console.log(fltr_key);
                    console.log(fltr_val);
                    console.log('**********');
                    where[fltr_key] = fltr_val * 1;
                    console.log(where);
                    console.log('*************');
                }
            }
        });
    }

    console.log(where);
    //search_text = 'adidas';
    var product_data_list = req.config.product_data_list;
    var final_data = new Array();
    var website_scrap_data = req.conn_website_scrap_data;
    var productObj = req.productObj;
    if (typeof search_text === 'undefined' || search_text == '') {
        res.json({
            error: 1,
            message: 'search text is empty'
        });
    } else {
        var search_products = [];
        final_data.text = search_text;
        final_data.result = search_products;
        where['$text'] = {'$search': search_text};
        console.log('!!! where !!!');
        console.log(where);
        /*
         website_scrap_data.find(where, {"score": {"$meta": "textScore"}}, {
         skip: skip_count,
         limit: products_per_page,
         sort: {'score': {'$meta': "textScore"}}
         }, search_results);
         function search_results(err, data) {
         if (err) {
         next(err);
         } else {
         if (typeof data != 'undefined' && data.length > 0) {
         for (var i = 0; i < data.length; i++) {
         var row = data[i];
         var obj = row;
         search_products.push(productObj.getProductPermit(req, obj));
         }
         final_data.result = search_products;
         res.json({
         error: 0,
         data: {
         current_page: current_page,
         products: search_products
         }
         });
         } else {
         res.json({
         error: 0,
         data: {}
         });
         }
         }
         }
         */

        website_scrap_data.aggregate(
                {$match: where},
                {$sort: {score: {$meta: "textScore"}}},
                {$skip: skip_count},
                {$limit: products_per_page},
                {$group: {'_id': '$name', 'data': {$push: "$$ROOT"}}},
        //{$project: project_project},
                search_results
                );
        function search_results(err, data) {
            if (err) {
                next(err);
            } else {
                if (typeof data != 'undefined' && data.length > 0) {
                    for (var k = 0; k < data.length; k++) {
                        if (data[k].data && data[k].data.length > 0) {
                            var website_wise = data[k].data;
                            for (var kk = 0; kk < 1; kk++) {
                                var rec = website_wise[kk];
                                if (rec)
                                    search_products.push(productObj.getProductPermit(req, rec));
                            }
                        }
                    }
                    res.json({
                        error: 0,
                        data: {
                            current_page: current_page,
                            products: search_products
                        }
                    });
                } else {
                    res.json({
                        error: 0,
                        data: {}
                    });
                }
                // console.log(search_products);

            }
        }
    }
});
module.exports = router;
