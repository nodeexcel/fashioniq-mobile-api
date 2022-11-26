function createDefaultWishlist(user, req, next) {
    var Wishlist = req.Wishlist;
    var wishlist = new Wishlist({
        name: 'Public',
        description: '',
        user_id: user.id,
        type: 'public',
        shared_ids: [],
        likes: [],
        followers: []
    });
    wishlist.save(function (err) {
        if (err) {
            next(err);
        } else {


            var wishlist = new Wishlist({
                name: 'Private',
                description: '',
                user_id: user.id,
                type: 'private',
                shared_ids: [],
                likes: [],
                followers: []
            });
            wishlist.save(function (err) {
                if (err) {
                    next(err);
                } else {
                    next(false);
                }
            });

        }
    });
}