/**
 * Copyright 2017 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Route
 */
interface IRoute {
    route: string;
    render: () => string;
}

class Router {
    private routes: Record<string, IRoute> = {};
    private currentRoute: IRoute | null = null;

    constructor(
        public el: HTMLElement,
        private defaultRoute = "",
    ) {}

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

const router = new Router(document.querySelector<HTMLElement>("#content")!, "overview");
const routables = queryAll(document.body, "[data-route]");
routables.forEach(routable => {
    const route = routable.getAttribute("data-route")!;
    router.register({
        render: () => routable.innerHTML,
        route,
    });
});
router.start();
