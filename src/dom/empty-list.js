import Component from 'inferno-component';
import Inferno from 'inferno';

export default class EmptyList extends Component {
    constructor(props) {
        super(props);

        this.state = {
            text: props.text
        };
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            text: nextProps.text
        });
    }

    shouldComponentUpdate(nextProps) {
        return this.state.text !== nextProps.text;
    }

    render() {
        return (<ol><li className='leaf'>
            <span className='title icon icon-file-empty empty'>{ this.state.text }</span>
        </li></ol>);
    }
}
