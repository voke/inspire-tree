import Component from 'inferno-component';
import Inferno from 'inferno';

export default class ToggleAnchor extends Component {
    constructor(props) {
        super(props);

        this.state = this.stateFromNode(props.node);
    }

    stateFromNode(node) {
        return {
            collapsed: node.collapsed()
        };
    }

    componentWillReceiveProps(data) {
        this.setState(this.stateFromNode(data.node));
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.state.collapsed !== nextState.collapsed;
    }

    className() {
        return 'toggle icon ' + (this.state.collapsed ? 'icon-expand' : 'icon-collapse');
    }

    toggle() {
        this.props.node.toggleCollapse();
    }

    render() {
        return <a className={this.className()} onClick={this.toggle.bind(this)} />;
    }
}
