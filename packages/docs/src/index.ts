/*
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

interface IRoute {
    route: string;
    render: () => string;
}

class Router {
    private routes: Record<string, IRoute> = {};
    private currentRoute: IRoute | null = null;

    constructor(public el: HTMLElement, private defaultRoute = "") {}

    public start() {
        const routeHandler = () => this.route();
        window.addEventListener("hashchange", routeHandler);
        window.addEventListener("load", routeHandler);
        this.route();
    }

    public register(route: IRoute) {
        this.routes[route.route] = route;
    }

    public route() {
        const hashRoute = location.hash.slice(1) || this.defaultRoute;
        const route = this.routes[hashRoute];

        if (this.el && route && route !== this.currentRoute) {
            this.currentRoute = route;
            this.el.innerHTML = route.render();
            selectCurrent(route.route);
        } else {
            this.currentRoute = null;
        }
    }
}

function queryAll(element: Element, selector: string) {
    return Array.from(element.querySelectorAll<HTMLElement>(selector));
}

const nav = document.querySelector("#nav")!;
function selectCurrent(route: string) {
    try {
        queryAll(nav, "a").forEach(a => a.classList.toggle("selected", false));
        queryAll(nav, 'a[href="#' + route + '"]').forEach(a => a.classList.toggle("selected", true));
    } catch (err) {
        // just bail if this doesn't work (IE)
    }
}

const router = new Router(document.querySelector<HTMLElement>("#content")!, "docs");
const routables = queryAll(document.body, "[data-route]");
routables.forEach(routable => {
    const route = routable.getAttribute("data-route")!;
    router.register({
        render: () => routable.innerHTML,
        route,
    });
});
router.start();
