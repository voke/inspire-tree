import Checkbox from './checkbox';
import Component from 'inferno-component';
import EditToolbar from './edit-toolbar';
import EmptyList from './empty-list';
import Inferno from 'inferno';
import List from './list';
import NodeAnchor from './node-anchor.js';
import ToggleAnchor from './toggle-anchor.js';

export default class ListItem extends Component {
    constructor(props) {
        super(props);

        this.state = this.stateFromNode(props.node);
    }

    stateFromNode(node) {
        return {
            dirty: node.itree.dirty
        };
    }

    componentWillReceiveProps(data) {
        this.setState(this.stateFromNode(data.node));
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextState.dirty;
    }

    getClassNames() {
        var node = this.props.node;
        var state = node.itree.state;
        var attributes = node.itree.li.attributes;

        // Set state classnames
        var classNames = [];

        // https://jsperf.com/object-keys-vs-each
        _.each(Object.keys(state), function(key) {
            if (state[key]) {
                classNames.push(key);
            }
        });

        // Inverse and additional classes
        if (!node.hidden() && node.removed()) {
            classNames.push('hidden');
        }

        if (node.expanded()) {
            classNames.push('expanded');
        }

        classNames.push(node.children ? 'folder' : 'leaf');

        // Append any custom class names
        var customClasses = attributes.class || attributes.className;
        if (_.isFunction(customClasses)) {
            customClasses = customClasses(node);
        }

        // Append content correctly
        if (!_.isEmpty(customClasses)) {
            if (_.isString(customClasses)) {
                classNames = classNames.concat(customClasses.split(' '));
            }
            else if (_.isArray(customClasses)) {
                classNames = classNames.concat(customClasses);
            }
        }

        return classNames.join(' ');
    }

    getAttributes() {
        var node = this.props.node;
        var attributes = _.clone(node.itree.li.attributes) || {};
        attributes.className = this.getClassNames();

        // Force internal-use attributes
        attributes['data-uid'] = node.id;

        return attributes;
    }

    renderCheckbox() {
        if (this.props.dom._tree.config.dom.showCheckboxes) {
            return <Checkbox dom={this.props.dom} node={this.props.node} />;
        }
    }

    renderChildren() {
        var node = this.props.node;

        if (node.hasChildren()) {
            return <List context={this.props.node} dom={this.props.dom} nodes={node.children} />;
        }
        else if (this.props.dom.isDynamic && !node.hasLoadedChildren()) {
            return <EmptyList text='Loading...' />;
        }
        else if (this.props.dom.isDynamic) {
            return <EmptyList text='No Results' />;
        }
    }

    renderEditToolbar() {
        // @todo fix this boolean
        if (this.props.dom._tree.config.editing.edit && !this.props.node.editing()) {
            return <EditToolbar dom={this.props.dom} node={this.props.node} />;
        }
    }

    renderToggle() {
        var node = this.props.node;
        var hasVisibleChildren = !this.props.dom.isDynamic ? node.hasVisibleChildren() : Boolean(node.children);

        if (hasVisibleChildren) {
            return <ToggleAnchor node={node} />;
        }
    }

    render() {
        var li = (<li {...this.getAttributes()} ref={domNode => this.props.node.itree.ref = domNode}>
            { this.renderEditToolbar() }
            <div className='title-wrap'>
                { this.renderToggle() }
                { this.renderCheckbox() }
                <NodeAnchor dom={this.props.dom} node={this.props.node} />
            </div>
            <div className='wholerow' />
            { this.renderChildren() }
        </li>);

        // Clear dirty bool only after everything has been generated (and states set)
        this.props.node.state('rendered', true);
        this.props.node.itree.dirty = false;

        return li;
    }
}
