import Component from 'inferno-component';
import EditForm from './edit-form';
import Inferno from 'inferno';
import stateComparator from '../lib/state-comparator';

export default class NodeAnchor extends Component {
    constructor(props) {
        super(props);

        this.state = this.stateFromNode(props.node);
    }

    stateFromNode(node) {
        return {
            editing: node.editing(),
            expanded: node.expanded(),
            hasOrWillHaveChildren: Boolean(node.children),
            text: node.text
        };
    }

    componentWillReceiveProps(data) {
        this.setState(this.stateFromNode(data.node));
    }

    shouldComponentUpdate(nextProps, nextState) {
        return stateComparator(this.state, nextState);
    }

    blur() {
        this.props.node.blur();
    }

    click(event) {
        var node = this.props.node;
        var dom = this.props.dom;

        // Define our default handler
        var handler = function() {
            event.preventDefault();

            if (node.editing()) {
                return;
            }

            if (event.metaKey || event.ctrlKey || event.shiftKey) {
                dom._tree.disableDeselection();
            }

            if (event.shiftKey) {
                dom.clearSelection();

                var selected = dom._tree.lastSelectedNode();
                if (selected) {
                    dom._tree.selectBetween.apply(dom._tree, dom._tree.boundingNodes(selected, node));
                }
            }

            if (node.selected()) {
                if (!dom._tree.config.selection.disableDirectDeselection) {
                    node.deselect();
                }
            }
            else {
                node.select();
            }

            dom._tree.enableDeselection();
        };

        // Emit an event with our forwarded MouseEvent, node, and default handler
        dom._tree.emit('node.click', event, node, handler);

        // Unless default is prevented, auto call our default handler
        if (!event.treeDefaultPrevented) {
            handler();
        }
    }

    dblclick(event) {
        var node = this.props.node;
        var dom = this.props.dom;

        // Define our default handler
        var handler = function() {
            // Clear text selection which occurs on double click
            dom.clearSelection();

            node.toggleCollapse();
        };

        // Emit an event with our forwarded MouseEvent, node, and default handler
        dom._tree.emit('node.dblclick', event, node, handler);

        // Unless default is prevented, auto call our default handler
        if (!event.treeDefaultPrevented) {
            handler();
        }
    }

    focus(event) {
        this.props.node.focus(event);
    }

    mousedown() {
        if (this.props.dom.isDragDropEnabled) {
            this.props.dom.isMouseHeld = true;
        }
    }

    render() {
        var node = this.props.node;
        var attributes = node.itree.a.attributes || {};
        attributes.className = 'title icon';
        attributes.tabindex = 1;
        attributes.unselectable = 'on';

        if (!this.props.dom._tree.config.dom.showCheckboxes) {
            var folder = this.state.expanded ? 'icon-folder-open' : 'icon-folder';
            attributes.className += ' ' + (node.itree.icon || (this.state.hasOrWillHaveChildren ? folder : 'icon-file-empty'));
        }

        var content = node.text;
        if (node.editing()) {
            content = <EditForm dom={this.props.dom} node={this.props.node} />;
        }

        return (<a
            onBlur={this.blur.bind(this)}
            onClick={this.click.bind(this)}
            onDblClick={this.dblclick.bind(this)}
            onFocus={this.focus.bind(this)}
            onMouseDown={this.mousedown.bind(this)}
            {...attributes}>{ content }</a>);
    }
}
