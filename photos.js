/*global jQuery, localStorage*/

var setupPhotos = (function($) {

    // ALWAYS
    'use strict';

    var CLASS = {
        fullHeart: 'icon-heart',
        emptyHeart: 'icon-heart-empty'
    },
    //
    cache = {},
    //
    store = window.localStorage;
    // var
    ;

    /**
     * Saves and loads favorited status from localStorage and/or cache
     * @param {Object} key - the key in storage for the favorited state
     * @param {Object} value - truthy or falsy value to store. NOTE: it will get converted to boolean
     *
     * @returns - truthy or falsy value for the provided key of favorited item.
     *
     */
    function favorited(key, value) {

        if ('undefined' === typeof value) {
            cache[key] = cache[key] || store.getItem(key);
            return cache[key];
        }

        if (!value) {
            delete cache[key];
            store.removeItem(key);
            return false;
        }

        store.setItem(key, true);
        cache[key] = true;
        return true;

    }


    /**
     *
     * @param {Object} value - a truthy or falsy value for the heart element class
     * @returns - {string} of the classes to apply to the heart element
     *
     */
    function heartClass(value) {
        return 'heart ' + ( value ? CLASS.fullHeart : CLASS.emptyHeart);
    }


    function heartState(value) {
        var test = 'heart ' + CLASS.fullHeart;
        value = '' + value;
        if (test === value) {
            return true;
        }
        return false;
    }


    function toggleHeartState(element) {
        var state = heartState(element.className);
        state = !state;
        element.className = heartClass(state);
        return state;
    }


    function createHeartIcon(options) {

        var heart = document.createElement('i'),
        //
        favorited = ( options = options || {}).favorited,
        //
        key = options.key ? '' + options.key : ''
        // var
        ;

        heart.className = heartClass(favorited);
        heart.setAttribute('data-key', key);

        return heart;

    }


    function each (items, callback) {
        var i;
        for (i = 0; i < items.length; i += 1) {
            setTimeout(callback.bind(this, items[i]), 0);
        }
    }


    function flatten (items) {
        return items.reduce(function (a, b) {
            return a.concat(b);
        });
    }


    function loadPhotosByTag (tag, max, callback) {
        var photos = [];
        var callback_name = 'callback_' + Math.floor(Math.random() * 100000);

        window[callback_name] = function (data) {
            delete window[callback_name];
            var i;
            for (i = 0; i < max; i += 1) {
                photos.push(data.items[i].media.m);
            }
            callback(null, photos);
        };

        $.ajax({
            url: 'http://api.flickr.com/services/feeds/photos_public.gne',
            data: {
                tags: tag,
                lang: 'en-us',
                format: 'json',
                jsoncallback: callback_name
            },
            dataType: 'jsonp'
        });
    }


    function loadAllPhotos (tags, max, callback) {
        var results = [];
        function handleResult (err, photos) {
            if (err) { return callback(err); }

            results.push(photos);
            if (results.length === tags.length) {
                callback(null, flatten(results));
            }
        }

        each(tags, function (tag) {
            loadPhotosByTag(tag, max, handleResult);
        });
    }


    function renderPhoto (photo) {
        var img = new Image();
        img.src = photo;
        return img;
    }


    function onClickImage(event) {

        var element = event.target, key = element.getAttribute('data-key');

        if (!key) {
            return;
        }

        favorited(key, toggleHeartState(element));

    }


    function imageAppender (id) {
        var holder = document.getElementById(id);
        return function (img) {
            var elm = document.createElement('div');
            elm.className = 'photo';
            elm.appendChild(img);
            holder.appendChild(elm);
        };
    }


    function imageAppender(id) {

        var holder = document.getElementById(id);

        holder.addEventListener('click', onClickImage);

        return function(img) {

            var elm = document.createElement('div');
            elm.className = 'photo';

            elm.appendChild(createHeartIcon({
                favorited: favorited(img.src),
                key: img.src
            }));

            elm.appendChild(img);
            holder.appendChild(elm);

        };

    }


   // ----
    var max_per_tag = 5;
    return function setup (tags, callback) {
        loadAllPhotos(tags, max_per_tag, function (err, items) {
            if (err) { return callback(err); }

            each(items.map(renderPhoto), imageAppender('photos'));
            callback();
        });
    };

}(jQuery));

