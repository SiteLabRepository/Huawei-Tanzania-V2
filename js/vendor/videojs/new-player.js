var huawei = huawei || {};
typeof module != "undefined" && (module.exports = huawei);

// html标签增加特定class, attribute，限定样式，兼容浏览器用
document.documentElement.className += " ie" + document.documentMode;
document.documentElement.setAttribute("data-userAgent", navigator.userAgent);

$(function ($) {
    huawei.playerLoad();
    huawei.mobilePlayerInit();
});

huawei.playerSetup = function () {
    // bof
    (function ($) {
        var playerInstance = null;

        function pauseVideo(e) {
            try {
                if (playerInstance) playerInstance.remove();
            } catch (_e) {}
        }

        $(document).off("vclick", ".js_video_player, .js-play-btn");

        $(document)
            .off("click", ".js_video_player, .js-play-btn")
            .on("click", ".js_video_player, .js-play-btn", function (e) {
                if (typeof videojs == "undefined") {
                    if (window.console) console.log("player 还未加载");
                    return false;
                }

                var $t = $(this);
                var playerid =
                    $(this).attr("data-player-id") || "js-player-" + $.uuid();
                $t.attr("data-player-id", playerid);
                if ($t.attr("data-play-nopop") == "1")
                    $t.parent()
                        .find(".player-outer-box")
                        .remove()
                        .end()
                        .prepend(
                            '<div class="player-outer-box"><span id="' +
                                playerid +
                                '"></span></div>',
                        );

                var video_path = $(this).attr("data-video-path");
                var video_name = $(this).attr("data-video-name"); // 增加视频名称
                if (video_name == "" || video_name == undefined) {
                    video_name = video_path; //视频名称为空，去取path
                }
                var autostart =
                    ($(this).attr("data-player-autostart") || "1") == "1";
                var ismobile = isMobile();
                if (ismobile)
                    video_path =
                        $(this).attr("data-video-path-mobile") || video_path;

                if (video_path && video_path.indexOf("//") == 0)
                    video_path = location.protocol + video_path;

                var player_options =
                    $(this).data("option") || $(this).data("options") || {};
                player_options["sources"] = player_options["sources"] || [];
                player_options["gaEvent"] = $(this).attr("data-onclick");
                var video_sources = [];
                var vlist = $(this).attr("data-video-sources");
                if (vlist) {
                    vlist = vlist.split(",");
                    for (var i = 0; i < vlist.length; i++) {
                        var v_info = vlist[i].split("|");
                        var label = $.trim(v_info[1] || "default");
                        video_sources[i] = {
                            file: $.trim(v_info[0]),
                            label: label,
                        };
                        video_sources[i]["src"] = video_sources[i]["file"];
                        if (!ismobile && label.indexOf("720") >= 0)
                            video_sources[i]["default"] = true;
                        else if (ismobile && label.indexOf("360") >= 0)
                            video_sources[i]["default"] = true;
                    }

                    if (ismobile) {
                        var md = $.grep(video_sources, function (v) {
                            return v["default"];
                        });
                        if (!md.length)
                            video_sources[video_sources.length - 1][
                                "default"
                            ] = true;
                    }
                }

                player_options["sources"] = video_sources.concat(
                    player_options["sources"],
                );
                if (
                    player_options["sources"].length == 0 &&
                    video_sources.length > 0
                )
                    player_options["sources"] = video_sources;
                else if (
                    video_path &&
                    video_sources.length == 0 &&
                    player_options["sources"].length == 0
                )
                    player_options["sources"] = [
                        { src: video_path, label: "default" },
                    ];
                else if (
                    !video_path &&
                    video_sources.length == 0 &&
                    player_options["sources"].length == 0 &&
                    $(this).attr("data-url")
                )
                    player_options["sources"] = [
                        { src: $(this).attr("data-url"), label: "default" },
                    ];

                if (player_options["sources"].length > 1) {
                    var sourceObj = {};
                    $.each(player_options["sources"], function (i, o) {
                        sourceObj[o.label.toLocaleLowerCase()] = o;
                    });

                    var defaultV = ismobile
                        ? sourceObj["360p"]
                        : sourceObj["720p"];
                    if (!defaultV) {
                        defaultV = player_options["sources"][0];
                    }

                    defaultV["selected"] = true;
                    defaultV["res"] = 720;
                }

                player_options["poster"] =
                    player_options["poster"] || $(this).attr("data-img-path");
                player_options["autoplay"] =
                    typeof player_options["autoplay"] == "boolean"
                        ? player_options["autoplay"]
                        : autostart;

                if ($(this).attr("data-play-nopop")) {
                    //$(this).next("img").fadeOut();
                    playerInstance = initPlayer(playerid, player_options);

                    $(this).addClass("invisible");
                    return false;
                }

                var play_html = $(
                    '<div id="videojs_player_wrapper"><div id="' +
                        playerid +
                        '"/></div>',
                );
                var $t = $(this);
                BootstrapDialog.show({
                    message: play_html,
                    cssClass: "video-dialog",
                    onshown: function () {
                        playerInstance = initPlayer(playerid, player_options);
                        playerInstance.onFullscreen = function (e) {
                            if (window.console) console.log(e);
                        };
                        setTimeout(function () {
                            $(".bootstrap-dialog.video-dialog").off("keyup");
                            // if (!ismobile)
                            // 	playerInstance && playerInstance.play(true);
                        }, 2000);
                    },
                    onhide: function (dialogRef) {
                        //playerInstance && playerInstance.play(false);// && playerInstance.remove();
                        //alert('Dialog is popping down, its message is ' + dialogRef.getMessage());
                        playerInstance && playerInstance.dispose();
                    },
                });

                return false;
            });
    })(jQuery);
    // eof
};

huawei.playerLoad = function (invokeSetup) {
    jQuery.loadScript = function (url, options) {
        // Allow user to set any option except for dataType, cache, and url
        options = $.extend(options || {}, {
            dataType: "script",
            cache: true,
            url: url,
        });

        // Use $.ajax() since it is more flexible than $.getScript
        // Return the jqXHR object so we can chain callbacks
        return jQuery.ajax(options);
    };

    window["lang"] =
        document.URL.indexOf("/cn/") >= 0 || $("html[lang=zh]").length
            ? "cn"
            : "en";
    window["videojsLanguage"] = window["lang"] == "cn" ? "zh-CN" : "en";
    window["playerLang"] = {};

    window["playerLang"]["en"] = {
        "Switch-Quality": "Switch quality",
        "Download-Video": "Download video",
    };
    window["playerLang"]["cn"] = {
        "Switch-Quality": "选择分辨率",
        "Download-Video": "下载视频",
    };

    function getVideoJs7() {
        $(
            '<link rel="stylesheet" href="https://www.huawei.com/Assets/corp/2020/js/lib/vendor/video.js/video-js.min.css" /><link rel="stylesheet" href="https://www.huawei.com/Assets/corp/2020/css/video-common.css" />',
        ).prependTo("head");
        return jQuery
            .loadScript(
                "https://www.huawei.com/Assets/corp/2020/js/lib/vendor/video.js/video.min.js",
            )
            .then(function (d) {});
    }

    invokeSetup = typeof invokeSetup == "boolean" ? invokeSetup : true;
    var ismobile = isMobile();
    var ie = isIE89();

    if (typeof BootstrapDialog == "undefined") {
        $(
            '<link rel="stylesheet" href="https://www.huawei.com/Assets/corp/minisite/js/vendor/bootstrap3-dialog/bootstrap-dialog.min.css">',
        ).prependTo("head");
        jQuery.loadScript(
            "https://www.huawei.com/Assets/corp/minisite/js/vendor/bootstrap3-dialog/bootstrap-dialog.min.js",
        );
    }

    var videoFn = getVideoJs7;

    if (typeof videojs != "undefined") {
        videoFn = function () {
            var dfd = jQuery.Deferred();
            setTimeout(function () {
                dfd.resolve("ok");
            }, 10);
            return dfd;
        };
    }

    var something = (function () {
        var executed = false;
        return function () {
            if (!executed) {
                executed = true;
                // do something

                videoFn().done(function (d) {
                    $(document).trigger("videojs-loaded");

                    if (!invokeSetup) return;
                    huawei.playerSetup();
                    if (ismobile) {
                        var $m = $(".js_video_player")
                            .filter("[data-play-nopop=1]")
                            .not("[data-mobile-init=0]");
                        $m.attr("data-player-autostart", "0");
                        setTimeout(function () {
                            $m.trigger("click");
                            // $(".js_video_player").filter("[data-player-mobile-init=1]").attr("data-player-autostart", "0").trigger("click");
                        }, 100);
                    }
                });
            }
        };
    })();
    function load_jwplayer_fn() {
        something();
    }
    load_jwplayer_fn();
};

huawei.mobilePlayerInit = function () {
    if (!isMobile()) return;
    window.mobVideoFlag = true;
    // $(".js_video_player").filter("[data-player-id]").attr("data-player-autostart", "0").trigger("click");

    $(".js_video_player").each(function (i, o) {
        if (
            $(this).attr("run_at_pc_module") ||
            $(this).attr("data-mobile-init") == "0"
        ) {
            return;
        }
        var player_id = "js-player-" + $.uuid();
        var player_placeholder =
            '<div class="player-outer-box"><a id="' +
            player_id +
            '"></a></div>';
        // $(this).attr("data-player-id", player_id).attr("data-play-nopop", 1)
        $(this)
            .attr("href", "javascript:void(0)")
            .parent()
            .prepend(player_placeholder);
        $(this)
            .attr("data-onclick", $(this).attr("onclick"))
            .prop("onclick", null);
    });
};

window.initPlayer = function (playerid, options) {
    options = options || {};
    $(
        '<div class="videojs-container"><video data-setup="{}" playsinline id="' +
            playerid +
            '" class="vjs-big-play-centered video-js  video-player center-block"></video></div>',
    ).replaceAll($("#" + playerid));
    var player_options = {
        controls: true,
        autoplay: true,
        preload: "none",
        fluid: true,
        sources: [],
        aspectRatio: "16:9",
        muted: false,
        plugins: {},
        language: window["videojsLanguage"],
    };
    options["aspectRatio"] =
        options["aspectRatio"] || options["aspectratio"] || "16:9";
    options["muted"] = options["muted"] || options["mute"] || false;
    options["loop"] = options["loop"] || options["repeat"] || false;

    if (videojs.getPlugin && videojs.getPlugin("videoJsResolutionSwitcher")) {
        var res = window.innerWidth >= 768 ? 720 : "low";
        player_options.plugins["videoJsResolutionSwitcher"] = {
            default: res, // Default resolution [{Number}, 'low', 'high'],
            dynamicLabel: true,
            textControl: window["playerLang"][window["lang"]]["Switch-Quality"],
        };
    }
    if (videojs.getPlugin && videojs.getPlugin("vjsdownload")) {
        player_options.plugins["vjsdownload"] = {
            beforeElement: "playbackRateMenuButton",
            textControl: window["playerLang"][window["lang"]]["Download-Video"],
            name: "downloadButton",
            //downloadURL: 'https://insert_source_here.mp4' //optional if you need a different download url than the source
        };
    }

    $.extend(player_options, options);

    var player = videojs.getPlayers()[playerid];
    if (player) player.dispose();

    var player = videojs(playerid, player_options);

    if (player_options["autoplay"])
        setTimeout(function () {
            player.play();
        }, 1000);

    if (videojs.getComponent("QualitySelector")) {
        player.controlBar
            .addChild("QualitySelector", {
                textControl: "Quality",
            })
            .controlText(
                window["playerLang"][window["lang"]]["Switch-Quality"],
            );
    }
    if (player.ga) player.ga();

    if (player_options.gaEvent) {
        var flag = false;
        var evt = function (e) {
            if (flag) return;
            flag = true;
            var gaEvent = new Function("e", player_options.gaEvent);
            gaEvent.apply(e);
        };
        if (player.one) player.one("play", evt);
        else player.on("play", evt);
    }

    var hasSend = false;
    player.on("play", function (e) {
        if (hasSend) return;
        hasSend = true;
        var url = player.currentSrc();
        try {
            utag.link({
                tealium_event: "video_clicked",
                video_id: url,
                video_name: "",
            });
        } catch (e) {}
    });

    return player;
};

function isIE89() {
    var ie = /(msie ([6-9]|10)|Trident)/i.test(navigator.userAgent);
    return ie;
}

function is_touch_device() {
    return (
        "ontouchstart" in window || // works on most browsers
        navigator.maxTouchPoints
    ); // works on IE10/11 and Surface
}
function isMobile() {
    var isMobile = {
        Android: function () {
            return navigator.userAgent.match(/Android/i);
        },
        BlackBerry: function () {
            return navigator.userAgent.match(/BlackBerry/i);
        },
        iOS: function () {
            return navigator.userAgent.match(/iPhone|iPad|iPod/i);
        },
        Opera: function () {
            return navigator.userAgent.match(/Opera Mini/i);
        },
        Windows: function () {
            return navigator.userAgent.match(/IEMobile/i);
        },
        any: function () {
            return (
                isMobile.Android() ||
                isMobile.BlackBerry() ||
                isMobile.iOS() ||
                isMobile.Opera() ||
                isMobile.Windows()
            );
        },
    };
    return isMobile.any();
}

/**
 * jQuery UUID plugin 1.0.0
 *
 * @author Eugene Burtsev
 */
(function ($) {
    $.uuid = function () {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
            /[xy]/g,
            function (c) {
                var r = (Math.random() * 16) | 0,
                    v = c == "x" ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            },
        );
    };
})(jQuery);

//
$(document).on("videojs-loaded.videojs-resolution-switcher", function () {
    $(
        "<style>video+.vjs-resolution-button-label {display:none;}.vjs-resolution-button {  color: #ccc;  font-family: VideoJS;}.vjs-resolution-button > .vjs-menu-button {  position: absolute;  top: 0;  left: 0;  width: 100%;  height: 100%;}.vjs-resolution-button .vjs-resolution-button-staticlabel {  pointer-events: none;  font-size: 1em;  line-height: 3em;  text-align: center;}/* .vjs-resolution-button .vjs-resolution-button-staticlabel:before {  content: '\f110';  font-size: 1.8em;  line-height: 1.67;} */.vjs-resolution-button .vjs-resolution-button-label {    pointer-events: none;    font-size: 1em;    line-height: 3em;    position: absolute;    top: 0;    left: 0;    width: 100%;    height: 100%;    text-align: center;    box-sizing: inherit;		font-family: Arial, Helvetica, sans-serif;}.vjs-resolution-button ul.vjs-menu-content {  width: 4em !important;}.vjs-resolution-button .vjs-menu {  left: 0;  bottom: 0;}.vjs-resolution-button .vjs-menu li {  text-transform: none;	font-size: 1em;	font-family: Arial, Helvetica, sans-serif;}</style>",
    ).appendTo("head");

    /*! videojs-resolution-switcher - 2015-7-26
     * Copyright (c) 2016 Kasper Moskwiak
     * Modified by Pierre Kraft
     * Licensed under the Apache-2.0 license. */
    !(function () {
        "use strict";
        var e = null;
        (e =
            void 0 === window.videojs && "function" == typeof require
                ? require("video.js")
                : window.videojs),
            (function (e, t) {
                var l,
                    s = {},
                    r = {},
                    i = {};
                function o(e, t, l, s) {
                    return (
                        (r = { label: l, sources: t }),
                        "function" == typeof s
                            ? s(e, t, l)
                            : (e.src(
                                  t.map(function (e) {
                                      return {
                                          src: e.src,
                                          type: e.type,
                                          res: e.res,
                                      };
                                  }),
                              ),
                              e)
                    );
                }
                var n = t.getComponent("MenuItem"),
                    a = t.extend(n, {
                        constructor: function (e, t, l, s) {
                            (this.onClickListener = l),
                                (this.label = s),
                                n.call(this, e, t),
                                (this.src = t.src),
                                this.on("click", this.onClick),
                                this.on("touchstart", this.onClick),
                                t.initialySelected &&
                                    (this.showAsLabel(),
                                    this.selected(!0),
                                    this.addClass("vjs-selected"));
                        },
                        showAsLabel: function () {
                            this.label &&
                                (this.label.innerHTML = this.options_.label);
                        },
                        onClick: function (e) {
                            this.onClickListener(this);
                            var t = this.player_.currentTime(),
                                l = this.player_.paused(),
                                s = this.player_.playbackRate(),
                                r = this.player_.options_.poster;
                            this.showAsLabel(), this.addClass("vjs-selected");
                            var i = this.player_;
                            setTimeout(function () {
                                i.play();
                            }, 500),
                                l
                                    ? this.player_.bigPlayButton.show()
                                    : (this.player_.bigPlayButton.hide(),
                                      r && this.player_.posterImage.setSrc("")),
                                "function" != typeof e &&
                                    "function" ==
                                        typeof this.options_
                                            .customSourcePicker &&
                                    (e = this.options_.customSourcePicker);
                            var n = "loadeddata";
                            "Youtube" !== this.player_.techName_ &&
                                "none" === this.player_.preload() &&
                                "Flash" !== this.player_.techName_ &&
                                (n = "timeupdate"),
                                o(
                                    this.player_,
                                    this.src,
                                    this.options_.label,
                                    e,
                                ).one(n, function () {
                                    this.player_.currentTime(t),
                                        l ||
                                            (this.player_.playbackRate(s),
                                            this.player_.play(),
                                            this.player_.posterImage.setSrc(r)),
                                        this.player_.trigger(
                                            "resolutionchange",
                                        );
                                });
                        },
                    }),
                    c = t.getComponent("MenuButton"),
                    u = t.extend(c, {
                        constructor: function (e, l, s, r) {
                            if (
                                ((this.sources = l.sources),
                                (this.label = r),
                                (this.label.innerHTML =
                                    l.initialySelectedLabel),
                                c.call(this, e, l, s),
                                this.controlText("Quality"),
                                s.dynamicLabel)
                            )
                                this.el().appendChild(r);
                            else {
                                var i = document.createElement("span");
                                t.dom.appendContent(i, l.initialySelectedLabel),
                                    t.dom.addClass(
                                        i,
                                        "vjs-resolution-button-staticlabel",
                                    ),
                                    this.el().appendChild(i);
                            }
                        },
                        createItems: function () {
                            var e = [],
                                t = (this.sources && this.sources.label) || {},
                                l = function (t) {
                                    e.map(function (e) {
                                        e.selected(e === t),
                                            e.removeClass("vjs-selected");
                                    });
                                };
                            for (var s in t)
                                t.hasOwnProperty(s) &&
                                    (e.push(
                                        new a(
                                            this.player_,
                                            {
                                                label: s,
                                                src: t[s],
                                                initialySelected:
                                                    s ===
                                                    this.options_
                                                        .initialySelectedLabel,
                                                customSourcePicker:
                                                    this.options_
                                                        .customSourcePicker,
                                            },
                                            l,
                                            this.label,
                                        ),
                                    ),
                                    (i[s] = e[e.length - 1]));
                            return e;
                        },
                    });
                (l = function (e) {
                    var l = t.mergeOptions(s, e),
                        n = this,
                        a = document.createElement("span"),
                        c = {};
                    function h(e, t) {
                        return e.res && t.res ? +t.res - +e.res : 0;
                    }
                    function d(e) {
                        var t = { label: {}, res: {}, type: {} };
                        return (
                            e.map(function (e) {
                                p(t, "label", e),
                                    p(t, "res", e),
                                    p(t, "type", e),
                                    y(t, "label", e),
                                    y(t, "res", e),
                                    y(t, "type", e);
                            }),
                            t
                        );
                    }
                    function p(e, t, l) {
                        null == e[t][l[t]] && (e[t][l[t]] = []);
                    }
                    function y(e, t, l) {
                        e[t][l[t]].push(l);
                    }
                    t.dom.addClass(a, "vjs-resolution-button-label"),
                        this.el().appendChild(a),
                        (n.updateSrc = function (e) {
                            if (!e) return n.src();
                            n.controlBar.resolutionSwitcher &&
                                (n.controlBar.resolutionSwitcher.dispose(),
                                delete n.controlBar.resolutionSwitcher),
                                (e = e.sort(h));
                            var s = (function (e, t) {
                                    var s = l.default,
                                        r = "";
                                    "high" === s
                                        ? ((s = t[0].res), (r = t[0].label))
                                        : "low" !== s && null != s && e.res[s]
                                        ? e.res[s] && (r = e.res[s][0].label)
                                        : ((s = t[t.length - 1].res),
                                          (r = t[t.length - 1].label));
                                    return {
                                        res: s,
                                        label: r,
                                        sources: e.res[s],
                                    };
                                })((c = d(e)), e),
                                r = new u(
                                    n,
                                    {
                                        sources: c,
                                        initialySelectedLabel: s.label,
                                        initialySelectedRes: s.res,
                                        customSourcePicker:
                                            l.customSourcePicker,
                                    },
                                    l,
                                    a,
                                );
                            return (
                                t.dom.addClass(r.el(), "vjs-resolution-button"),
                                (n.controlBar.resolutionSwitcher =
                                    n.controlBar.el_.insertBefore(
                                        r.el_,
                                        n.controlBar.getChild(
                                            "fullscreenToggle",
                                        ).el_,
                                    )),
                                (n.controlBar.resolutionSwitcher.dispose =
                                    function () {
                                        this.parentNode.removeChild(this);
                                    }),
                                o(n, s.sources, s.label)
                            );
                        }),
                        (n.currentResolution = function (e, t) {
                            return (
                                console.log("currentResolution: ", e),
                                null == e
                                    ? r
                                    : (console.log("currentResolution: ", i[e]),
                                      null != i[e] && i[e].onClick(t),
                                      n)
                            );
                        }),
                        (n.getGroupedSrc = function () {
                            return c;
                        }),
                        n.ready(function () {
                            n.options_.sources.length > 1 &&
                                n.updateSrc(n.options_.sources),
                                "Youtube" === n.techName_ &&
                                    (function (e) {
                                        e.tech_.ytPlayer.setPlaybackQuality(
                                            "default",
                                        ),
                                            e.tech_.ytPlayer.addEventListener(
                                                "onPlaybackQualityChange",
                                                function () {
                                                    e.trigger(
                                                        "resolutionchange",
                                                    );
                                                },
                                            ),
                                            e.one("play", function () {
                                                var t =
                                                        e.tech_.ytPlayer.getAvailableQualityLevels(),
                                                    s = {
                                                        highres: {
                                                            res: 1080,
                                                            label: "1080",
                                                            yt: "highres",
                                                        },
                                                        hd1080: {
                                                            res: 1080,
                                                            label: "1080",
                                                            yt: "hd1080",
                                                        },
                                                        hd720: {
                                                            res: 720,
                                                            label: "720",
                                                            yt: "hd720",
                                                        },
                                                        large: {
                                                            res: 480,
                                                            label: "480",
                                                            yt: "large",
                                                        },
                                                        medium: {
                                                            res: 360,
                                                            label: "360",
                                                            yt: "medium",
                                                        },
                                                        small: {
                                                            res: 240,
                                                            label: "240",
                                                            yt: "small",
                                                        },
                                                        tiny: {
                                                            res: 144,
                                                            label: "144",
                                                            yt: "tiny",
                                                        },
                                                        auto: {
                                                            res: 0,
                                                            label: "auto",
                                                            yt: "default",
                                                        },
                                                    },
                                                    r = [];
                                                t.map(function (t) {
                                                    r.push({
                                                        src: e.src().src,
                                                        type: e.src().type,
                                                        label: s[t].label,
                                                        res: s[t].res,
                                                        _yt: s[t].yt,
                                                    });
                                                });
                                                var i = "auto",
                                                    o = 0,
                                                    n =
                                                        ((c = d(r)).label.auto,
                                                        new u(
                                                            e,
                                                            {
                                                                sources: c,
                                                                initialySelectedLabel:
                                                                    i,
                                                                initialySelectedRes:
                                                                    o,
                                                                customSourcePicker:
                                                                    function (
                                                                        t,
                                                                        l,
                                                                        s,
                                                                    ) {
                                                                        return (
                                                                            e.tech_.ytPlayer.setPlaybackQuality(
                                                                                l[0]
                                                                                    ._yt,
                                                                            ),
                                                                            e
                                                                        );
                                                                    },
                                                            },
                                                            l,
                                                            a,
                                                        ));
                                                n
                                                    .el()
                                                    .classList.add(
                                                        "vjs-resolution-button",
                                                    ),
                                                    (e.controlBar.resolutionSwitcher =
                                                        e.controlBar.addChild(
                                                            n,
                                                        ));
                                            });
                                    })(n);
                        });
                }),
                    (t.registerPlugin || t.plugin)(
                        "videoJsResolutionSwitcher",
                        l,
                    );
            })(window, e);
    })();
});

$(document).on("videojs-loaded.videojs-ga", function () {
    (function () {
        var e =
            [].indexOf ||
            function (e) {
                for (var t = 0, n = this.length; t < n; t++)
                    if (t in this && this[t] === e) return t;
                return -1;
            };
        (videojs.registerPlugin = videojs.registerPlugin || videojs.plugin),
            videojs.registerPlugin("ga", function (t) {
                var n,
                    a,
                    i,
                    r,
                    o,
                    l,
                    s,
                    u,
                    c,
                    d,
                    h,
                    v,
                    f,
                    g,
                    p,
                    y,
                    m,
                    M,
                    T,
                    w,
                    b;
                null == t && (t = {}),
                    (n = {}),
                    this.options()["data-setup"] &&
                        (d = JSON.parse(this.options()["data-setup"])).ga &&
                        (n = d.ga),
                    (a = [
                        "loaded",
                        "percentsPlayed",
                        "start",
                        "end",
                        "seek",
                        "play",
                        "pause",
                        "resize",
                        "volumeChange",
                        "error",
                        "fullscreen",
                        "downloadvideo",
                    ]),
                    (s = t.eventsToTrack || n.eventsToTrack || a),
                    (f =
                        t.percentsPlayedInterval ||
                        n.percentsPlayedInterval ||
                        10),
                    (o = t.eventCategory || n.eventCategory || "Video"),
                    (l = t.eventLabel || n.eventLabel),
                    (t.debug = t.debug || !1),
                    (v = []),
                    (m = y = 0),
                    (M = !1),
                    (c = function () {
                        l ||
                            (l = this.currentSrc()
                                .split("/")
                                .slice(-1)[0]
                                .replace(/\.(\w{3,4})(\?.*)?$/i, "")),
                            e.call(s, "loadedmetadata") >= 0 &&
                                T("loadedmetadata", !0);
                    }),
                    (w = function () {
                        var t, n, a, i, r;
                        for (
                            t = Math.round(this.currentTime()),
                                n = Math.round(this.duration()),
                                i = Math.round((t / n) * 100),
                                a = r = 0;
                            r <= 99;
                            a = r += f
                        )
                            i >= a &&
                                e.call(v, a) < 0 &&
                                (e.call(s, "start") >= 0 && 0 === a && i > 0
                                    ? T("start", !1)
                                    : e.call(s, "percentsPlayed") >= 0 &&
                                      0 !== i &&
                                      T("percent played", !1, a),
                                i > 0 && v.push(a));
                        e.call(s, "seek") >= 0 &&
                            ((m = y),
                            (y = t),
                            Math.abs(m - y) > 1 &&
                                ((M = !0),
                                T("seek start", !1, m),
                                T("seek end", !1, y)));
                    }),
                    (i = function () {
                        T("end", !1);
                    }),
                    (g = function () {
                        var e;
                        (e = Math.round(this.currentTime())),
                            T("play", !1, e),
                            (M = !1);
                    }),
                    (h = function () {
                        var e;
                        (e = Math.round(this.currentTime())) ===
                            Math.round(this.duration()) ||
                            M ||
                            T("pause", !1, e);
                    }),
                    (b = function () {
                        var e;
                        (e = !0 === this.muted() ? 0 : this.volume()),
                            T("volume change", !1, e);
                    }),
                    (p = function () {
                        T("resize - " + this.width() + "*" + this.height(), !0);
                    }),
                    (r = function () {
                        var e;
                        (e = Math.round(this.currentTime())), T("error", !0, e);
                    }),
                    (u = function () {
                        var e;
                        (e = Math.round(this.currentTime())),
                            ("function" == typeof this.isFullscreen
                                ? this.isFullscreen()
                                : void 0) ||
                            ("function" == typeof this.isFullScreen
                                ? this.isFullScreen()
                                : void 0)
                                ? T("enter fullscreen", !1, e)
                                : T("exit fullscreen", !1, e);
                    });
                var q = function () {
                        var e;
                        (e = Math.round(this.currentTime())),
                            T("downloadvideo", !1, e);
                    },
                    k = this;
                return (
                    (T = function (e, n, a) {
                        (l =
                            k.currentSrc().split("/").slice(-1)[0] +
                            "|" +
                            location.pathname +
                            location.search),
                            window.ga
                                ? ga("send", "event", {
                                      eventCategory: o,
                                      eventAction: e,
                                      eventLabel: l,
                                      eventValue: a,
                                      nonInteraction: n,
                                  })
                                : window._gaq
                                ? _gaq.push(["_trackEvent", o, e, l, a, n])
                                : t.debug &&
                                  console.log("Google Analytics not detected");
                    }),
                    this.ready(function () {
                        if (
                            (this.on("loadedmetadata", c),
                            this.on("timeupdate", w),
                            this.on("qualityRequested", function () {
                                var e = Math.round(this.currentTime());
                                T("qualityRequested", !1, e);
                            }),
                            this.on("qualitySelected", function () {
                                var e = Math.round(this.currentTime());
                                T("qualitySelected", !1, e);
                            }),
                            e.call(s, "downloadvideo") >= 0 &&
                                this.on("downloadvideo", q),
                            e.call(s, "end") >= 0 && this.on("ended", i),
                            e.call(s, "play") >= 0 && this.on("play", g),
                            e.call(s, "pause") >= 0 && this.on("pause", h),
                            e.call(s, "volumeChange") >= 0 &&
                                this.on("volumechange", b),
                            e.call(s, "resize") >= 0 && this.on("resize", p),
                            e.call(s, "error") >= 0 && this.on("error", r),
                            e.call(s, "fullscreen") >= 0)
                        )
                            return this.on("fullscreenchange", u);
                    }),
                    { sendbeacon: T }
                );
            });
    }.call(this));
});

$(document).on("videojs-loaded.videojs-language", function () {
    videojs.addLanguage("zh-CN", {
        Play: "播放",
        Pause: "暂停",
        "Current Time": "当前时间",
        Duration: "时长",
        "Remaining Time": "剩余时间",
        "Stream Type": "媒体流类型",
        LIVE: "直播",
        Loaded: "加载完成",
        Progress: "进度",
        Fullscreen: "全屏",
        "Non-Fullscreen": "退出全屏",
        "Picture-in-Picture": "画中画",
        "Exit Picture-in-Picture": "退出画中画",
        Mute: "静音",
        Unmute: "取消静音",
        "Playback Rate": "播放速度",
        Subtitles: "字幕",
        "subtitles off": "关闭字幕",
        Captions: "内嵌字幕",
        "captions off": "关闭内嵌字幕",
        Chapters: "节目段落",
        "Close Modal Dialog": "关闭弹窗",
        Descriptions: "描述",
        "descriptions off": "关闭描述",
        "Audio Track": "音轨",
        "You aborted the media playback": "视频播放被终止",
        "A network error caused the media download to fail part-way.":
            "网络错误导致视频下载中途失败。",
        "The media could not be loaded, either because the server or network failed or because the format is not supported.":
            "视频因格式不支持或者服务器或网络的问题无法加载。",
        "The media playback was aborted due to a corruption problem or because the media used features your browser did not support.":
            "由于视频文件损坏或是该视频使用了你的浏览器不支持的功能，播放终止。",
        "No compatible source was found for this media.":
            "无法找到此视频兼容的源。",
        "The media is encrypted and we do not have the keys to decrypt it.":
            "视频已加密，无法解密。",
        "Play Video": "播放视频",
        Close: "关闭",
        "Modal Window": "弹窗",
        "This is a modal window": "这是一个弹窗",
        "This modal can be closed by pressing the Escape key or activating the close button.":
            "可以按ESC按键或启用关闭按钮来关闭此弹窗。",
        ", opens captions settings dialog": ", 开启标题设置弹窗",
        ", opens subtitles settings dialog": ", 开启字幕设置弹窗",
        ", opens descriptions settings dialog": ", 开启描述设置弹窗",
        ", selected": ", 选择",
        "captions settings": "字幕设定",
        "Audio Player": "音频播放器",
        "Video Player": "视频播放器",
        Replay: "重新播放",
        "Progress Bar": "进度条",
        "Volume Level": "音量",
        "subtitles settings": "字幕设定",
        "descriptions settings": "描述设定",
        Text: "文字",
        White: "白",
        Black: "黑",
        Red: "红",
        Green: "绿",
        Blue: "蓝",
        Yellow: "黄",
        Magenta: "紫红",
        Cyan: "青",
        Background: "背景",
        Window: "窗口",
        Transparent: "透明",
        "Semi-Transparent": "半透明",
        Opaque: "不透明",
        "Font Size": "字体尺寸",
        "Text Edge Style": "字体边缘样式",
        None: "无",
        Raised: "浮雕",
        Depressed: "压低",
        Uniform: "均匀",
        Dropshadow: "下阴影",
        "Font Family": "字体库",
        "Proportional Sans-Serif": "比例无细体",
        "Monospace Sans-Serif": "单间隔无细体",
        "Proportional Serif": "比例细体",
        "Monospace Serif": "单间隔细体",
        Casual: "舒适",
        Script: "手写体",
        "Small Caps": "小型大写字体",
        Reset: "重置",
        "restore all settings to the default values": "恢复全部设定至预设值",
        Done: "完成",
        "Caption Settings Dialog": "字幕设定窗口",
        "Beginning of dialog window. Escape will cancel and close the window.":
            "打开对话窗口。Escape键将取消并关闭对话窗口",
        "End of dialog window.": "结束对话窗口",
        "Seek to live, currently behind live": "尝试直播，当前为延时播放",
        "Seek to live, currently playing live": "尝试直播，当前为实时播放",
        "progress bar timing: currentTime={1} duration={2}": "{1}/{2}",
        "{1} is loading.": "正在加载 {1}。",
    });
});
