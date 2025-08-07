/**
 * Copyright 2017 Palantir Technologies, Inc. All rights reserved.
 */

// Outline tracker instance
let currentOutlineTracker: SimpleOutlineTracker | null = null;

/**
 * Route
 */
interface Route {
    path: string;
    render: () => string;
}

class Router {
    private routes: Record<string, Route> = {};
    private currentRoute: Route | null = null;

    constructor(
        public el: HTMLElement,
        private defaultRoute = "",
        private outlineContainer?: HTMLElement,
    ) {}

    public start() {
        const routeHandler = () => this.route();
        window.addEventListener("hashchange", routeHandler);
        window.addEventListener("load", routeHandler);
        this.route();
    }

    public register(route: Route) {
        this.routes[route.path] = route;
    }

    public route() {
        const hashRoute = location.hash.slice(1) || this.defaultRoute;
        const route = this.routes[hashRoute];

        if (this.el && route && route !== this.currentRoute) {
            this.currentRoute = route;
            this.el.innerHTML = route.render();
            selectCurrent(route.path);
            
            if (this.outlineContainer) {
                updatePageOutline(this.el);
            }
        } else {
            this.currentRoute = null;
        }
    }
}

/**
 * A simple outline tracker to handle highlighting the active section in the TOC.
 */
class SimpleOutlineTracker {
    private tocLinks: HTMLAnchorElement[] = [];
    private headings: Array<{
        element: HTMLElement;
        link: HTMLAnchorElement;
        top: number;
    }> = [];
    
    // Observer for tracking heading visibility
    private intersectionObserver: IntersectionObserver | null = null;
    private visibleHeadings = new Map<Element, number>(); // Element to score mapping

    // Track user click state with auto-expiring timeout
    private lastClickedLink: HTMLAnchorElement | null = null;
    private clickBiasTimeoutId: number | null = null;
    private readonly CLICK_BIAS_DURATION = 5000; // Click bias lasts 5 seconds

    constructor() {
        this.init();
    }

    private init() {
        this.setupScrollListener();
        this.setupIntersectionObserver();
    }

    private setupScrollListener() {
        // Use passive scroll listener with RAF for performance
        let ticking = false;

        const scrollHandler = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    // Only use scroll handler for fallback or supplementary updates
                    this.setActiveLinks();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', scrollHandler, { passive: true });
    }

    private setupIntersectionObserver() {
        // Configure the intersection observer for heading elements
        const options = {
            rootMargin: '-20px 0px -80% 0px', // Biases towards headings in the top portion
            threshold: [0, 0.25, 0.5, 0.75, 1]
        };

        this.intersectionObserver = new IntersectionObserver((entries) => {
            // Process all intersection entries
            entries.forEach(entry => {
                // Calculate a score based on intersection ratio and position
                if (entry.isIntersecting) {
                    // Scoring factors:                    
                    // 1. How much of the element is visible (0-1)
                    // 2. Position in viewport (higher = better score)
                    const viewportHeight = window.innerHeight;
                    const positionScore = 1 - (entry.boundingClientRect.top / viewportHeight);
                    
                    // Higher position and higher visibility both increase score
                    const score = (entry.intersectionRatio * 0.7) + (positionScore * 0.3);
                    
                    // Store the score for this heading
                    this.visibleHeadings.set(entry.target, score);
                } else {
                    // Remove from visible headings when no longer intersecting
                    this.visibleHeadings.delete(entry.target);
                }
            });
            
            // Update TOC based on new intersection data
            this.setActiveLinks();
        }, options);
    }

    private collectHeadings() {
        // Clear previous observer if any
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.setupIntersectionObserver();
        }

        // Map TOC links to their target elements
        this.headings = this.tocLinks.map(link => {
            const targetId = link.getAttribute('href')?.slice(1);
            const target = targetId ? document.getElementById(targetId) : null;
            
            // Observe each heading target for intersection
            if (target && this.intersectionObserver) {
                this.intersectionObserver.observe(target);
            }
            
            return {
                element: target!,
                link,
                top: target ? target.offsetTop : 0
            };
        }).filter(h => h.element).sort((a, b) => a.top - b.top);
    }

    /**
     * Set up click handlers for all TOC links to provide immediate feedback
     */
    private setupClickHandlers() {
        this.tocLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Get target element from href
                const targetId = link.getAttribute('href')?.slice(1);
                const targetElement = targetId ? document.getElementById(targetId) : null;
                
                if (targetElement) {
                    // Clear any existing click bias timeout
                    if (this.clickBiasTimeoutId !== null) {
                        window.clearTimeout(this.clickBiasTimeoutId);
                    }
                    
                    // Set this as the clicked link with temporary bias
                    this.lastClickedLink = link;
                    
                    // Create a timeout to clear the click bias after a few seconds
                    this.clickBiasTimeoutId = window.setTimeout(() => {
                        this.lastClickedLink = null;
                        this.clickBiasTimeoutId = null;
                        this.setActiveLinks(); // Update after bias expires
                    }, this.CLICK_BIAS_DURATION);
                    
                    // Scroll to the target with offset
                    const offsetTop = targetElement.offsetTop - 20;
                    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                    
                    // Update active link immediately for responsive feel
                    this.tocLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            });
        });

        // Initialize active state
        this.setActiveLinks();
    }

    /**
     * Algorithm for determining the active TOC item
     * with special handling for page top/bottom and click bias.
     */
    public setActiveLinks() {
        // Remove active class from all links first
        this.tocLinks.forEach(link => link.classList.remove('active'));
        
        // Handle empty cases
        if (this.headings.length === 0) return;
        
        // Special case: check if we're at the very top of the page
        const isAtPageTop = window.scrollY < 10;
        if (isAtPageTop && this.tocLinks.length > 0) {
            // At the top, activate the first TOC link
            const firstLink = this.tocLinks[0];
            firstLink.classList.add('active');
            return;
        }
        
        // Special case: check if we're at the bottom of the page
        const scrollBottom = window.scrollY + window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;
        const isAtPageBottom = scrollBottom >= docHeight - 10;
        
        // Store this information for later use
        let bottomPageSelection: HTMLAnchorElement | null = null;
        
        if (isAtPageBottom && this.tocLinks.length > 0) {
            // Find the last heading with level 0 (section header)
            const lastHeadingWithProperLevel = [...this.headings]
                .reverse()
                .find(h => {
                    const level = parseInt(h.link.getAttribute('data-level') || '0', 10);
                    return level === 0; // Find the last top-level heading
                });
            
            if (lastHeadingWithProperLevel) {
                bottomPageSelection = lastHeadingWithProperLevel.link;
            }
        }
        
        // Handle click bias: prefer the clicked link if it's recent
        if (this.lastClickedLink) {
            // Find the clicked heading in our tracking data
            const clickedHeading = this.headings.find(h => h.link === this.lastClickedLink);
            
            if (clickedHeading) {
                // For clicked links, we'll keep them active even at page bottom
                // as long as we're still within the bias timeout or it's visible
                const isClickedVisible = this.visibleHeadings.has(clickedHeading.element);
                
                if (isClickedVisible || this.clickBiasTimeoutId !== null) {
                    // Apply click bias - mark the clicked link as active
                    this.lastClickedLink.classList.add('active');
                    return;
                }
            }
        }
        
        // Main algorithm: find the best visible heading based on scores
        if (this.visibleHeadings.size > 0) {
            // Convert visible headings map to array for sorting
            const headingEntries = Array.from(this.visibleHeadings.entries());
            
            // Sort by score (highest first)
            headingEntries.sort((a, b) => b[1] - a[1]);
            
            // Get the heading with the highest score
            const bestHeadingElement = headingEntries[0][0];
            
            // Find the corresponding heading in our tracking data
            const activeHeading = this.headings.find(h => h.element === bestHeadingElement);
            
            if (activeHeading) {
                // Apply active class to the best heading's link
                activeHeading.link.classList.add('active');
                return;
            }
        }
        
        // Fallback: If no headings are visible,
        // find the last heading above the viewport
        const scrollY = window.scrollY;
        
        // Find the last heading above the current scroll position
        const headingsAboveViewport = this.headings
            .filter(h => h.top < scrollY)
            .sort((a, b) => b.top - a.top); // Sort by position, bottom to top
        
        if (headingsAboveViewport.length > 0) {
            // Get the last heading above viewport and mark it as active
            const lastHeadingAbove = headingsAboveViewport[0];
            lastHeadingAbove.link.classList.add('active');
        } else if (bottomPageSelection) {
            // If we're at the bottom of the page and no other heading is active
            bottomPageSelection.classList.add('active');
        } else if (this.tocLinks.length > 0) {
            // If nothing above viewport, use first link as fallback
            const firstLink = this.tocLinks[0];
            firstLink.classList.add('active');
        }
    }

    /**
     * Update the outline with a new set of TOC links
     */
    public updateOutline(tocLinks: HTMLAnchorElement[]) {
        // Store the new links
        this.tocLinks = tocLinks;
        
        // Collect and observe the headings
        this.collectHeadings();
        
        // Set up click handlers for the links
        this.setupClickHandlers();
        
        // Initial update of active links
        this.setActiveLinks();
        
        // Handle window resize events
        window.addEventListener('resize', () => {
            this.collectHeadings();
            this.setActiveLinks();
        });
    }

    /**
     * Clean up resources when the tracker is no longer needed
     */
    public destroy() {
        // Disconnect the intersection observer
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
        }
        
        // Clear any pending timeout
        if (this.clickBiasTimeoutId !== null) {
            window.clearTimeout(this.clickBiasTimeoutId);
            this.clickBiasTimeoutId = null;
        }
    }
}

function isIntersectingViewport(el: Element) {
    const rect = el.getBoundingClientRect();
    const vWidth = window.innerWidth ?? document.documentElement.clientWidth;
    const vHeight = window.innerHeight ?? document.documentElement.clientHeight;

    // Return false if it's not in the viewport
    if (rect.right < 0 || rect.bottom < 0 || rect.left > vWidth || rect.top > vHeight) {
        return false;
    }

    // Return true if any of its four corners are visible
    const isCornerVisible = (x: number, y: number): boolean => {
        const elementAtPoint = document.elementFromPoint(x, y);
        return elementAtPoint ? el.contains(elementAtPoint) : false;
    };

    return (
        isCornerVisible(rect.left, rect.top) ||
        isCornerVisible(rect.right, rect.top) ||
        isCornerVisible(rect.right, rect.bottom) ||
        isCornerVisible(rect.left, rect.bottom)
    );
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

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function updatePageOutline(contentEl: HTMLElement) {
    const outlineItemsContainer = document.querySelector<HTMLElement>(".outline-items");
    if (!outlineItemsContainer) return;
    
    // Destroy existing tracker
    if (currentOutlineTracker) {
        currentOutlineTracker.destroy();
        currentOutlineTracker = null;
    }
    
    outlineItemsContainer.innerHTML = "";
    
    const headings = contentEl.querySelectorAll("h2, h3, h4, h5, h6");
    const outlineContainer = document.querySelector<HTMLElement>("#page-outline");
    
    if (headings.length === 0 && outlineContainer) {
        outlineContainer.style.display = "none";
        return;
    } else if (outlineContainer) {
        outlineContainer.style.display = "flex";
    }
    
    const headingArray = Array.from(headings).map((heading) => {
        const el = heading as HTMLElement;
        const level = parseInt(el.tagName.substring(1), 10);
        const text = (el.textContent || "").replace(/\s*\{#.+\}$/, "");
        const id = el.id || slugify(text);
        
        if (!el.id) {
            el.id = id;
        }
        
        return { el, level, text, id, offsetTop: el.offsetTop };
    });
    
    headingArray.sort((a, b) => a.offsetTop - b.offsetTop);
    const tocLinks: HTMLAnchorElement[] = [];
    
    headingArray.forEach((heading, index) => {
        const item = document.createElement("a");
        item.className = "outline-item";
        item.href = `#${heading.id}`;
        item.textContent = heading.text;
        
        const indentLevel = Math.max(0, heading.level - 2);
        const indentPadding = 10 + (indentLevel * 10);
        
        item.style.cssText = `
            display: block;
            padding-left: ${indentPadding}px;
            text-decoration: none;
            font-size: 0.875rem;
            transition: all 0.2s ease;
            position: relative;
            margin-bottom: 0.1rem;
        `;
        
        if (heading.text.length > 28) {
            item.title = heading.text;
            item.textContent = heading.text.substring(0, 25) + '...';
        }
        
        // Store data attributes for level
        item.setAttribute('data-index', index.toString());
        item.setAttribute('data-level', indentLevel.toString());
        
        tocLinks.push(item);
        outlineItemsContainer.appendChild(item);
    });
    
    // Initialize outline tracker
    if (outlineContainer && tocLinks.length > 0) {
        currentOutlineTracker = new SimpleOutlineTracker();
        currentOutlineTracker.updateOutline(tocLinks);
    }
}

// Initialize router
const outlineContainer = document.querySelector<HTMLElement>("#page-outline");
const router = new Router(
    document.querySelector<HTMLElement>("#content")!, 
    "overview", 
    outlineContainer || undefined
);

const routables = queryAll(document.body, "[data-route]");
routables.forEach(routable => {
    router.register({
        path: routable.getAttribute("data-route")!,
        render: () => routable.innerHTML,
    });
});

router.start();