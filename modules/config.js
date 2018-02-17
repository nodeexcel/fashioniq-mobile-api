module.exports = function () {
    return function (req, res, next) {
        config = {
            'products_per_page': 20,
            'product_data_list': 'cat_id sub_cat_id name website brand price img href offrate price_history price_diff sort_score model_no', // add here to get fields in product info
        };
        SORTING = [
            {'text': 'Popular', 'param': 'likes', 'sort': {'count_likes': -1}},
            {'text': 'Most Viewed', 'param': 'mostviewed', 'sort': {'count_view': 1}},
            {'text': 'Price -- Low to High', 'param': 'pricelth', 'sort': {'price': 1}},
            {'text': 'Price -- High to Low', 'param': 'pricehtl', 'sort': {'price': -1}}
        ];
//        body = {
//            'cat_id':30,
//            'sub_cat_id':3001,
//            'father_key':'men',
//            'father_text':'men',
//            'page':1,
//            'filters':[
//                {name: 'Name',param: filter__text__website__snapdeal},
//            ],
//            //filter : [{
//                //size : [size1,soze2             ]
//            //}]
//        };
        req.SORTING = SORTING;
        req.config = config;
//        req.body = body;
        next();
    }
}