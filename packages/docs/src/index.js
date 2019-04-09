/*
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */
var Router = /** @class */ (function () {
    function Router(el, defaultRoute) {
        if (defaultRoute === void 0) { defaultRoute = ""; }
        this.el = el;
        this.defaultRoute = defaultRoute;
        this.routes = {};
        this.currentRoute = null;
    }
    Router.prototype.start = function () {
        var _this = this;
        var routeHandler = function () { return _this.route(); };
        window.addEventListener("hashchange", routeHandler);
        window.addEventListener("load", routeHandler);
        this.route();
    };
    Router.prototype.register = function (route) {
        this.routes[route.route] = route;
    };
    Router.prototype.route = function () {
        var hashRoute = location.hash.slice(1) || this.defaultRoute;
        var route = this.routes[hashRoute];
        if (this.el && route && route !== this.currentRoute) {
            this.currentRoute = route;
            this.el.innerHTML = route.render();
            selectCurrent(route.route);
        }
        else {
            this.currentRoute = null;
        }
    };
    return Router;
}());
function queryAll(element, selector) {
    return Array.from(element.querySelectorAll(selector));
}
var nav = document.querySelector("#nav");
function selectCurrent(route) {
    try {
        queryAll(nav, "a").forEach(function (a) { return a.classList.toggle("selected", false); });
        queryAll(nav, 'a[href="#' + route + '"]').forEach(function (a) { return a.classList.toggle("selected", true); });
    }
    catch (err) {
        // just bail if this doesn't work (IE)
    }
}
var router = new Router(document.querySelector("#content"), "docs");
var routables = queryAll(document.body, "[data-route]");
routables.forEach(function (routable) {
    var route = routable.getAttribute("data-route");
    router.register({
        render: function () { return routable.innerHTML; },
        route: route,
    });
});
router.start();
