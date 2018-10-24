import React from 'react';
import PropTypes from 'prop-types';
import { ScrollManager, withManager } from './ScrollManager';

class ManagedElementScroller extends React.Component {
  constructor(props) {
    super(props);
    this._ref = React.createRef();
  }

  componentDidMount() {
    this._register();
  }

  componentWillUnmount() {
    this._unregister(this.props);
  }

  componentDidUpdate(prevProps) {
    this._unregister(prevProps);
    this._register();
  }

  _register() {
    const { manager, scrollKey } = this.props;
    const node = this._ref.current;
    if (!manager) {
      console.warn('ElementScroller only works when nested within a ScrollManager'); // eslint-disable-line no-console
    } else if (scrollKey && node) {
      manager._registerElement(scrollKey, node);
    }
  }

  _unregister(props) {
    const { manager, scrollKey } = props;
    if (manager && scrollKey) {
      manager._unregisterElement(scrollKey);
    }
  }

  render() {
    return React.cloneElement(React.Children.only(this.props.children), { ref: this._ref });
  }
}

ManagedElementScroller.propTypes = {
  manager: PropTypes.instanceOf(ScrollManager).isRequired,
  scrollKey: PropTypes.string.isRequired,
  children: PropTypes.element.isRequired
};

export const ElementScroller = withManager(ManagedElementScroller);
