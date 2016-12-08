import Component from 'inferno-component';
import Inferno from 'inferno';

export default class EditToolbar extends Component {
    constructor(props) {
        super(props);
    }

    shouldComponentUpdate() {
        return false;
    }

    add(event) {
        event.stopPropagation();

        node.addChild(blankNode());
        node.expand();
    }

    edit(event) {
        event.stopPropagation();

        this.props.node.toggleEditing();
    }

    remove(event) {
        event.stopPropagation();

        this.props.node.remove();
    }

    render() {
        var buttons = [];

        if (this.props.dom._tree.config.editing.edit) {
            buttons.push(<a className='btn icon icon-pencil' onclick={this.edit.bind(this)} title='Edit this node'></a>);
        }

        if (this.props.dom._tree.config.editing.add) {
            buttons.push(<a className='btn icon icon-plus' onclick={this.add.bind(this)} title='Add a child node'></a>);
        }

        if (this.props.dom._tree.config.editing.remove) {
            buttons.push(<a className='btn icon icon-minus' onclick={this.remove.bind(this)} title='Remove this node'></a>);
        }

        return <span className='btn-group'>{ buttons }</span>;
    }
}
