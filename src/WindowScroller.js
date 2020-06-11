import React from 'react';
import PropTypes from 'prop-types';
import { ScrollManager, withManager } from './ScrollManager';

class ManagedWindowScroller extends React.Component {
  componentDidMount() {
    const { manager } = this.props;
    if (manager) {
      manager._restoreInitial();
    } else {
      console.warn('WindowScroller only works when nested within a ScrollManager'); // eslint-disable-line no-console
    }
  }

  componentDidUpdate() {
    const { manager } = this.props;
    if (manager) {
      manager._restoreWindow();
    }
  }

  render() {
    return this.props.children;
  }
}

ManagedWindowScroller.propTypes = {
  manager: PropTypes.instanceOf(ScrollManager).isRequired,
  children: PropTypes.node
};

export const WindowScroller = withManager(ManagedWindowScroller);
