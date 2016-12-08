import Component from 'inferno-component';
import Inferno from 'inferno';
import List from './list';

/**
 * Helper method to create an object for a new node.
 *
 * @private
 * @return {void}
 */
function blankNode() {
    return {
        text: 'New Node',
        itree: {
            state: {
                editing: true,
                focused: true
            }
        }
    };
}

export default class Tree extends Component {
    add() {
        this.props.dom._tree.focused().blur();

        this.props.dom._tree.addNode(blankNode());
    }

    renderAddLink() {
        if (this.props.dom._tree.config.editing.add) {
            return <li><a className='btn icon icon-plus' onClick={this.add.bind(this)} title='Add a new root node'></a></li>;
        }
    }

    render() {
        return <List dom={this.props.dom} nodes={this.props.nodes}>{ this.renderAddLink() }</List>;
    }
}
