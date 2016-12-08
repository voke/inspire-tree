import Component from 'inferno-component';
import Inferno from 'inferno';
import stateComparator from '../lib/state-comparator';

export default class Checkbox extends Component {
    constructor(props) {
        super(props);

        this.state = this.getStateFromNodes(props.node);
    }

    getStateFromNodes(node) {
        return {
            checked: node.checked(),
            indeterminate: node.indeterminate()
        };
    }

    componentWillReceiveProps(data) {
        this.setState(this.getStateFromNodes(data.node));
    }

    shouldComponentUpdate(nextProps, nextState) {
        return stateComparator(this.state, nextState);
    }

    click(event) {
        // Define our default handler
        var handler = () => {
            this.props.node.toggleCheck();
        };

        // Emit an event with our forwarded MouseEvent, node, and default handler
        this.props.dom._tree.emit('node.click', event, this.props.node, handler);

        // Unless default is prevented, auto call our default handler
        if (!event.treeDefaultPrevented) {
            handler();
        }
    }

    render() {
        return (<input
            checked={this.props.node.checked()}
            indeterminate={this.props.node.indeterminate()}
            onClick={this.click.bind(this)}
            ref={elem => elem.indeterminate = this.state.indeterminate}
            type='checkbox' />);
    }
}
