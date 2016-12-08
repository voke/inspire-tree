'use strict';

// Libs
import * as _ from 'lodash';
import { render } from 'inferno';
import Inferno from 'inferno';
import Tree from './dom/tree';

/**
 * Default InspireTree rendering logic.
 *
 * @category DOM
 * @return {InspireDOM} Default renderer.
 */
export default class InspireDOM {
    constructor(tree) {
        // Init properties
        this._tree = tree;
        this.batching = 0;
        this.dropTargets = [];
        this.$scrollLayer;

        // Cache because we use in loops
        this.isDynamic = _.isFunction(this._tree.config.data);
        this.contextMenuChoices = this._tree.config.contextMenu;
    }

    /**
     * Apply pending data changes to the DOM.
     *
     * Will skip rendering as long as any calls
     * to `batch` have yet to be resolved,
     *
     * @category DOM
     * @private
     * @return {void}
     */
    applyChanges() {
        // Never rerender when until batch complete
        if (this.batching > 0) {
            return;
        }

        this.renderNodes();
    }

    /**
     * Attaches to the DOM element for rendering.
     *
     * @category DOM
     * @private
     * @param {HTMLElement} target Element, selector, or jQuery-like object.
     * @return {void}
     */
    attach(target) {
        var dom = this;
        dom.$target = dom.getElement(target);
        dom.$scrollLayer = dom.getScrollableAncestor(dom.$target);

        if (!dom.$target) {
            throw new Error('No valid element to attach to.');
        }

        // Set classnames
        var classNames = dom.$target.className.split(' ');
        classNames.push('inspire-tree');

        if (dom._tree.config.editable) {
            classNames.push('editable');

            _.each(_.pickBy(dom._tree.config.editing, _.identity), function(v, key) {
                classNames.push('editable-' + key);
            });
        }

        dom.$target.className = classNames.join(' ');
        dom.$target.setAttribute('tabindex', dom._tree.config.tabindex || 0);

        // Handle keyboard interaction
        dom.$target.addEventListener('keyup', dom.keyboardListener.bind(dom));

        var dragTargetSelectors = dom._tree.config.dragTargets;
        if (!_.isEmpty(dragTargetSelectors)) {
            _.each(dragTargetSelectors, function(selector) {
                var dropTarget = dom.getElement(selector);

                if (dropTarget) {
                    dom.dropTargets.push(dropTarget);
                }
                else {
                    throw new Error('No valid element found for drop target ' + selector);
                }
            });
        }

        dom.isDragDropEnabled = dom.dropTargets.length > 0;

        if (dom.isDragDropEnabled) {
            document.addEventListener('mouseup', dom.mouseUpListener.bind(dom));
            document.addEventListener('mousemove', dom.mouseMoveListener.bind(dom));
        }

        // Sync browser focus to focus state
        dom._tree.on('node.focused', function(node) {
            var elem = node.itree.ref.querySelector('.title');
            if (elem !== document.activeElement) {
                elem.focus();
            }
        });

        // Set pagination limits
        this.pagination = {
            limit: this.getNodesLimit()
        };

        var limit = this.pagination.limit;
        dom._tree.on('model.loaded', () => {
            // Set context-specific pagination
            dom._tree.nodes().recurseDown(function(node) {
                if (node.children) {
                    node.itree.pagination = {
                        limit: limit,
                        total: node.hasChildren() ? node.children.length : -1
                    };
                }
            });
        });

        dom._tree.on('node.added', (node) => {
            if (node.children) {
                node.itree.pagination = {
                    limit: limit,
                    total: node.hasChildren() ? node.children.length : -1
                };
            }
        });

        // Listen for scrolls for automatic loading
        if ((dom._tree.config.dom.deferredRendering || dom._tree.config.deferredLoading) && dom._tree.config.dom.autoLoadMore) {
            dom.$target.addEventListener('scroll', _.throttle(dom.scrollListener.bind(dom), 20));
        }

        dom.$target.inspireTree = dom._tree;
    }

    /**
     * Disable rendering in preparation for multiple changes.
     *
     * @category DOM
     * @private
     * @return {void}
     */
    batch() {
        if (this.batching < 0) {
            this.batching = 0;
        }

        this.batching++;
    }

    /**
     * Clear page text selection, primarily after a click event which
     * natively selects a range of text.
     *
     * @category DOM
     * @private
     * @return {void}
     */
    clearSelection() {
        if (document.selection && document.selection.empty) {
            document.selection.empty();
        }
        else if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }
    }

    /**
     * Creates a draggable element by cloning a target,
     * registers a listener for mousemove.
     *
     * @private
     * @param {HTMLElement} element DOM Element.
     * @param {Event} event Click event to use.
     * @return {void}
     */
    createDraggableElement(element, event) {
        this.$dragNode = this.nodeFromTitleDOMElement(element);

        var rect = element.getBoundingClientRect();
        var diffX = event.clientX - rect.left;
        var diffY = event.clientY - rect.top;

        this.dragHandleOffset = { left: diffX, top: diffY };

        this.$dragElement = element.cloneNode(true);
        this.$dragElement.className += ' dragging';
        this.$dragElement.style.top = rect.top + 'px';
        this.$dragElement.style.left = rect.left + 'px';
        this.$target.appendChild(this.$dragElement);
    }

    /**
     * Permit rerendering of batched changes.
     *
     * @category DOM
     * @private
     * @return {void}
     */
    end() {
        this.batching--;

        if (this.batching === 0) {
            this.applyChanges();
        }
    }

    /**
     * Get the pagination for the given context node, or root if undefined.
     *
     * @param {TreeNode} context Context node.
     * @return {object} Pagination configuration object.
     */
    getContextPagination(context) {
        return context ? _.get(context, 'itree.pagination') : this.pagination;
    }

    /**
     * Get an HTMLElement through various means:
     * An element, jquery object, or a selector.
     *
     * @private
     * @param {mixed} target Element, jQuery selector, selector.
     * @return {HTMLElement} Matching element.
     */
    getElement(target) {
        var $element;

        if (target instanceof HTMLElement) {
            $element = target;
        }
        else if (_.isObject(target) && _.isObject(target[0])) {
            $element = target[0];
        }
        else if (_.isString(target)) {
            var match = document.querySelector(target);
            if (match) {
                $element = match;
            }
        }

        return $element;
    }

    /**
     * Get the max nodes per "page" we'll allow. Defaults to how many nodes can fit.
     *
     * @private
     * @return {integer} Node count
     */
    getNodesLimit() {
        var limit = this._tree.config.pagination.limit;
        return (limit > 0 ? limit : _.ceil(this.$scrollLayer.clientHeight / this._tree.config.dom.nodeHeight)) || 20;
    }

    /**
     * Helper method to find a scrollable ancestor element.
     *
     * @param  {HTMLElement} $element Starting element.
     * @return {HTMLElement} Scrollable element.
     */
    getScrollableAncestor($element) {
        if ($element instanceof Element) {
            var style = getComputedStyle($element);
            if (style.overflow !== 'auto' && $element.parentNode) {
                $element = this.getScrollableAncestor($element.parentNode);
            }
        }

        return $element;
    }

    /**
     * Listen to keyboard event for navigation.
     *
     * @private
     * @param {Event} event Keyboard event.
     * @return {void}
     */
    keyboardListener(event) {
        // Navigation
        var focusedNode = this._tree.focused();
        if (focusedNode) {
            focusedNode = focusedNode[0];
            switch (event.which) {
                case 40:
                    this.moveFocusDownFrom(focusedNode);
                    break;
                case 13:
                    focusedNode.toggleSelect();
                    break;
                case 37:
                    focusedNode.collapse();
                    break;
                case 39:
                    focusedNode.expand();
                    break;
                case 38:
                    this.moveFocusUpFrom(focusedNode);
                    break;
                default:
            }
        }
    }

    /**
     * Loads/renders additional nodes for a given context, or the root.
     *
     * @private
     * @param {TreeNode} context Parent node, or none for root.
     * @param {Event} event Click or scroll event which triggered this call.
     * @return {Promise} Resolves with request results.
     */
    loadMore(context, event) {
        if (this.loading) {
            return;
        }

        var pagination = this.getContextPagination(context);
        var promise;

        // Set loading flag, prevents repeat requests
        this.loading = true;
        this.batch();

        // Mark this context as dirty since we'll update text/tree nodes
        _.invoke(context, 'markDirty');

        // Increment the pagination
        pagination.limit += this.getNodesLimit();

        // Emit an event
        this._tree.emit('node.paginate', context, pagination, event);

        if (this._tree.config.deferredLoading) {
            if (context) {
                promise = context.loadChildren();
            }
            else {
                promise = this._tree.load(this._tree.config.data);
            }
        }
        else {
            this.loading = false;
        }

        this.end();

        // Clear the loading flag
        if (this._tree.config.deferredLoading) {
            promise.then(() => {
                this.loading = false;
                this.applyChanges();
            }).catch(function() {
                this.loading = false;
                this.applyChanges();
            });
        }

        return promise;
    }

    /**
     * Listener for mouse move events for drag and drop.
     * Is removed automatically on mouse up.
     *
     * @private
     * @param {Event} event Mouse move event.
     * @return {void}
     */
    mouseMoveListener(event) {
        if (this.isMouseHeld && !this.$dragElement) {
            this.createDraggableElement(event.target, event);
        }
        else if (this.$dragElement) {
            event.preventDefault();
            event.stopPropagation();

            var x = event.clientX - this.dragHandleOffset.left;
            var y = event.clientY - this.dragHandleOffset.top;

            this.$dragElement.style.left = x + 'px';
            this.$dragElement.style.top = y + 'px';

            var validTarget;
            _.each(this.dropTargets, function(target) {
                var rect = target.getBoundingClientRect();

                if (event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom) {
                    validTarget = target;
                    return false;
                }
            });

            // If new target found for the first time
            if (!this.$activeDropTarget && validTarget && validTarget.className.indexOf('itree-active-drop-target') === -1) {
                validTarget.className += ' itree-active-drop-target';
            }

            this.$activeDropTarget = validTarget;
        }
    }

    /**
     * Handle mouse up events for dragged elements.
     *
     * @return {void}
     */
    mouseUpListener() {
        this.isMouseHeld = false;

        if (this.$dragElement) {
            this.$dragElement.parentNode.removeChild(this.$dragElement);

            if (this.$activeDropTarget) {
                var targetIsTree = _.isFunction(_.get(this.$activeDropTarget, 'inspireTree.addNode'));

                // Notify that the node was "dropped out" of this tree
                this._tree.emit('node.dropout', this.$dragNode, this.$activeDropTarget, targetIsTree);

                // If drop target supports the addNode method, invoke it
                if (targetIsTree) {
                    var newNode = this.$activeDropTarget.inspireTree.addNode(this.$dragNode.copyHierarchy().toObject());

                    // Notify that the node was "dropped out"
                    this.$activeDropTarget.inspireTree.emit('node.dropin', newNode);
                }
            }
        }

        if (this.$activeDropTarget) {
            this.$activeDropTarget.className = this.$activeDropTarget.className.replace('itree-active-drop-target', '');
        }

        this.$dragNode = null;
        this.$dragElement = null;
        this.$activeDropTarget = null;
    }

    /**
     * Move select down the visible tree from a starting node.
     *
     * @private
     * @param {object} startingNode Node object.
     * @return {void}
     */
    moveFocusDownFrom(startingNode) {
        var next = startingNode.nextVisibleNode();
        if (next) {
            next.focus();
        }
    }

   /**
    * Move select up the visible tree from a starting node.
    *
    * @private
    * @param {object} startingNode Node object.
    * @return {void}
    */
    moveFocusUpFrom(startingNode) {
        var prev = startingNode.previousVisibleNode();
        if (prev) {
            prev.focus();
        }
    }

    /**
     * Helper method for obtaining the data-uid from a DOM element.
     *
     * @private
     * @param {HTMLElement} element HTML Element.
     * @return {object} Node object
     */
    nodeFromTitleDOMElement(element) {
        var uid = element.parentNode.parentNode.getAttribute('data-uid');
        return this._tree.node(uid);
    }

    /**
     * Triggers rendering for the given node array.
     *
     * @category DOM
     * @private
     * @param {array} nodes Array of node objects.
     * @return {void}
     */
    renderNodes(nodes) {
        render(<Tree dom={this} nodes={nodes || this._tree.nodes()} />, this.$target);
    };

    /**
     * Listens for scroll events, to automatically trigger
     * Load More links when they're scrolled into view.
     *
     * @category DOM
     * @private
     * @param {Event} event Scroll event.
     * @return {void}
     */
    scrollListener(event) {
        if (!this.rendering && !this.loading) {
            // Get the bounding rect of the scroll layer
            var rect = this.$scrollLayer.getBoundingClientRect();

            // Find all load-more links
            var links = document.querySelectorAll('.load-more');
            _.each(links, (link) => {
                // Look for load-more links which overlap our "viewport"
                var r = link.getBoundingClientRect();
                var overlap = !(rect.right < r.left || rect.left > r.right || rect.bottom < r.top || rect.top > r.bottom);

                if (overlap) {
                    // Auto-trigger Load More links
                    var context;

                    var $parent = link.parentNode.parentNode.parentNode;
                    if ($parent.tagName === 'LI') {
                        context = this._tree.node($parent.getAttribute('data-uid'));
                    }

                    this.loadMore(context, event);
                }
            });
        }
    }

    /**
     * Scroll the first selected node into view.
     *
     * @category DOM
     * @private
     * @return {void}
     */
    scrollSelectedIntoView() {
        var $tree = document.querySelector('.inspire-tree');
        var $selected = $tree.querySelector('.selected');

        if ($selected && dom.$scrollLayer) {
            dom.$scrollLayer.scrollTop = $selected.offsetTop;
        }
    }
}
