import Component from 'inferno-component';
import Inferno from 'inferno';
import ListItem from './list-item';
import stateComparator from '../lib/state-comparator';

export default class List extends Component {
    constructor(props) {
        super(props);

        this.state = this.getStateFromNodes(props.nodes);
    }

    getStateFromNodes(nodes) {
        var pagination = this.props.dom.getContextPagination(this.props.context);

        return {
            limit: _.get(pagination, 'limit', nodes.length),
            loading: this.props.dom.loading,
            total: _.get(pagination, 'total', nodes.length)
        };
    }

    componentWillReceiveProps(data) {
        this.setState(this.getStateFromNodes(data.nodes));
    }

    shouldComponentUpdate(nextProps, nextState) {
        return _.find(nextProps.nodes, 'itree.dirty') || stateComparator(this.state, nextState);
    }

    isDeferred() {
        return this.props.dom._tree.config.dom.deferredRendering || this.props.dom._tree.config.deferredLoading;
    }

    loadMore(event) {
        event.preventDefault();

        this.props.dom.loadMore(this.props.context, event);
    }

    renderLoadMoreNode() {
        return (<li className='leaf detached'>
            <a className='title icon icon-more load-more' onClick={this.loadMore.bind(this)}>Load More</a>
        </li>);
    }

    renderLoadingTextNode() {
        return (<li className='leaf'>
            <span className='title icon icon-more'>Loading...</span>
        </li>);
    }

    render() {
        var renderNodes = this.props.nodes;

        // If rendering deferred, chunk the nodes client-side
        if (this.props.dom._tree.config.dom.deferredRendering) {
            // Determine the limit. Either for our current context or for the root level
            var limit = this.state.limit || this.props.dom.getNodeslimit();

            // Slice the current nodes by this context's pagination
            renderNodes = _.slice(this.props.nodes, 0, limit);
        }

        // Render nodes as list items
        var items = _.map(renderNodes, (node) => {
            return <ListItem dom={this.props.dom} key={node.id} node={node} />;
        });

        if (this.isDeferred() && this.state.limit < this.state.total) {
            if (!this.state.loading) {
                items.push(this.renderLoadMoreNode());
            }
            else {
                items.push(this.renderLoadingTextNode());
            }
        }

        return <ol>{ items }{ this.props.children }</ol>;
    }
}
