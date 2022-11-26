var express = require('express');
var router = express.Router();

const { trending, latesCount, latest, myCount, my, top, listTop, stats } = require('../../controller/v1/feeds');
//http://stackoverflow.com/questions/11653545/hot-content-algorithm-score-with-time-decay
//https://coderwall.com/p/cacyhw/an-introduction-to-ranking-algorithms-seen-on-social-news-aggregators

router.all('/trending', trending);
//--start----latest feed-------------------



router.all('/latest/count', latesCount);
router.all('/latest', latest);
//--end------latest feed-------------------
router.all('/my/count', myCount);
router.all('/my', my);
router.all('/user/top', top);
router.all('/list/top', listTop);


//cron route
router.all('/stats', stats);

module.exports = router;