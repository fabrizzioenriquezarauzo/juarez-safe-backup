const Router = {
    routes: {},
    init() {
        // Listen to hash changes instead of popstate
        window.addEventListener('hashchange', () => {
            this.loadRoute(window.location.hash);
        });

        // Intercept all links
        document.body.addEventListener('click', e => {
            const link = e.target.closest('[data-link]');
            if (link) {
                e.preventDefault();
                // Get the raw href attribute, e.g. "/login"
                const path = link.getAttribute('href');
                this.navigateTo(path);
            }
        });

        // Initial load
        this.loadRoute(window.location.hash || '/');
    },

    addRoute(path, viewInitCallback) {
        this.routes[path] = viewInitCallback;
    },

    navigateTo(path) {
        // Force prefixing with /
        const formattedPath = path.startsWith('/') ? path : '/' + path;
        window.location.hash = '#' + formattedPath;
    },

    loadRoute(hash) {
        // Convert '#/login' to '/login'
        let path = hash.replace('#', '');
        if (path === '') path = '/';

        // Basic catch-all to home if route not found
        const callback = this.routes[path] || this.routes['/'];
        if (callback) {
            callback();
        }
    }
};

export default Router;
