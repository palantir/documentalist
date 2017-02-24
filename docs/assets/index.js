class Router {
    constructor(el) {
        this.el = el;
        this.routes = {};
    }

    start() {
        window.addEventListener("hashchange", this.route.bind(this));
        window.addEventListener("load", this.route.bind(this));
        this.route();
    }

    register(route) {
        this.routes[route.route] = route;
    }

    route() {
        const hashRoute = location.hash.slice(1) || "default";
        const route = this.routes[hashRoute];

        if (this.el && route && route != this.currentRoute) {
            this.currentRoute = route;
            route.render(this.el);
        } else {
            this.currentRoute = null;
        }
    }
}

const router = new Router(document.querySelector("#content"));
const routables = document.querySelectorAll("[data-route]");
routables.forEach((routable) => {
    const route = routable.getAttribute("data-route");
    router.register({
        route: route,
        render: (el) => {
            el.innerHTML = routable.innerHTML;
        },
    });
});
router.start();
