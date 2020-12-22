import React from 'react';
import PropTypes from 'prop-types';
import timedMutationObserver from './timedMutationObserver';

const debug = require('debug')('ScrollManager');

const ManagerContext = React.createContext();

const defaultTimeout = 3000;
// const defaultSkippingSaveDeferredScroll = true;
const defaultBlockSizeTolerance = 0;

export class ScrollManager extends React.Component {
  constructor(props) {
    super(props);

    const { history, sessionKey = 'ScrollManager', timeout = defaultTimeout } = props;

    if ('scrollRestoration' in window.history) {
      this._originalScrollRestoration = window.history.scrollRestoration;
      window.history.scrollRestoration = 'manual';
    }

    // load positions and associated tracking data from session state
    try {
      const data = sessionStorage.getItem(sessionKey);
      this._session = JSON.parse(data || '{}');
    } catch (e) {
      debug('Error reading session storage:', e.message);
      this._session = {};
    }
    this._positions = this._session.positions || (this._session.positions = {});
    this._locations = this._session.locations || (this._session.locations = []);
    this._historyStart = history.length - this._locations.length;
    const initialKey = 'initial';
    this._locationKey = this._session.locationKey || initialKey;

    // initialize emphemeral state of scrollable nodes
    this._scrollableNodes = {};
    this._deferredNodes = {};

    window.addEventListener('beforeunload', () => {
      // write everything back to session state on unload
      this._savePositions();
      this._session.locationKey = this._locationKey;
      try {
        sessionStorage.setItem(sessionKey, JSON.stringify(this._session));
      } catch (e) {
        // session state full or unavailable
      }
    });

    this._unlisten = history.listen((location, action) => {
      this._savePositions();

      // cancel any pending hash scroller
      if (this._hashScroller) {
        this._hashScroller.cancel();
        this._hashScroller = null;
      }

      // clean up positions no longer in history to avoid leaking memory
      // (including last history element if action is PUSH or REPLACE)
      const locationCount = Math.max(0, history.length - this._historyStart - (action !== 'POP' ? 1 : 0));
      while (this._locations.length > locationCount) {
        const key = this._locations.pop();
        delete this._positions[key];
      }

      const key = location.key || initialKey;
      if (action !== 'POP') {
        // track the new location key in our array of locations
        this._locations.push(key);
        this._historyStart = history.length - this._locations.length;

        // check for hash links that need deferral of scrolling into view
        if (typeof location.hash === 'string' && location.hash.length > 1) {
          const elementId = location.hash.substring(1);
          this._hashScroller = timedMutationObserver(() => {
            const element = document.getElementById(elementId);
            if (element) {
              debug(`Scrolling element ${elementId} into view`);
              element.scrollIntoView();
              return true;
            }
            return false;
          }, timeout);
          this._hashScroller.catch(e => {
            if (!e.cancelled) {
              debug(`Timeout scrolling hash element ${elementId} into view`);
            }
          });
        }
      }

      // set current location key for saving position on next history change
      this._locationKey = key;
    });
  }

  componentWillUnmount() {
    if (this._unlisten) {
      this._unlisten();
    }
    if (this._originalScrollRestoration) {
      window.history.scrollRestoration = this._originalScrollRestoration;
    }
  }

  render() {
    return (
      <ManagerContext.Provider value={this}>
        {this.props.children}
      </ManagerContext.Provider>
    );
  }

  _registerElement(scrollKey, node) {
    this._scrollableNodes[scrollKey] = node;
    this._restoreNode(scrollKey);
  }

  _unregisterElement(scrollKey) {
    delete this._scrollableNodes[scrollKey];
  }

  _savePositions() {
    // use pageXOffset instead of scrollX for IE compatibility
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollX#Notes
    const { pageXOffset: scrollX, pageYOffset: scrollY } = window;
    this._savePosition('window', { scrollX, scrollY });
    for (const scrollKey in this._scrollableNodes) {
      const node = this._scrollableNodes[scrollKey];
      const { scrollLeft, scrollTop } = node;
      this._savePosition(scrollKey, { scrollLeft, scrollTop });
    }
  }

  _savePosition(scrollKey, position) {
    debug('save', this._locationKey, scrollKey, position);
    // const { skippingSaveDeferredScroll = defaultSkippingSaveDeferredScroll } = this.props;

    // if (!(!(scrollKey in this._deferredNodes) && skippingSaveDeferredScroll)) {
    if (scrollKey in this._deferredNodes) {
      this._cancelDeferred(scrollKey);
    }
    let loc = this._positions[this._locationKey];
    if (!loc) {
      loc = this._positions[this._locationKey] = {};
    }
    loc[scrollKey] = position;
    ///////////////////////////////////////////////////////////////////////////////
    // No need this because since now there are no false positives on save calls //
    ///////////////////////////////////////////////////////////////////////////////
    // } else {
    //   debug(`Skipping save due to deferred scroll of ${scrollKey}`);
    // }
  }

  _loadPosition(scrollKey) {
    const loc = this._positions[this._locationKey];
    return loc ? loc[scrollKey] || null : null;
  }

  _restoreNode(scrollKey) {
    const position = this._loadPosition(scrollKey);
    const { scrollLeft = 0, scrollTop = 0 } = position || {};
    const { blockSizeTolerance = defaultBlockSizeTolerance } = this.props;
    debug('restore', this._locationKey, scrollKey, scrollLeft, scrollTop);

    this._cancelDeferred(scrollKey);
    const node = this._scrollableNodes[scrollKey];
    const attemptScroll = () => {
      const availableScrollX = node.scrollWidth - node.clientWidth + blockSizeTolerance;
      const availableScrollY = node.scrollHeight - node.clientHeight + blockSizeTolerance;
      if (availableScrollX >= scrollX && availableScrollY >= scrollY) {
        node.scrollLeft = scrollLeft;
        node.scrollTop = scrollTop;
      }
      return node.scrollLeft + blockSizeTolerance >= scrollLeft && node.scrollTop + blockSizeTolerance >= scrollTop;
    };
    if (!attemptScroll()) {
      const failedScroll = () => {
        debug(`Could not scroll ${scrollKey} to (${scrollLeft}, ${scrollTop})` +
          `; scroll size is (${node.scrollWidth}, ${node.scrollHeight})`);
      };

      const { timeout = defaultTimeout } = this.props;
      if (timeout) {
        debug(`Deferring scroll of ${scrollKey} for up to ${timeout} ms`);
        (this._deferredNodes[scrollKey] = timedMutationObserver(attemptScroll, timeout, node))
          .then(() => delete this._deferredNodes[scrollKey])
          .catch(e => { if (!e.cancelled) failedScroll() });
      } else {
        failedScroll();
      }
    }
  }

  _restoreWindow() {
    const scrollKey = 'window';
    const position = this._loadPosition(scrollKey);
    const { scrollX = 0, scrollY = 0 } = position || {};
    const { blockSizeTolerance = defaultBlockSizeTolerance } = this.props;
    debug('restore', this._locationKey, scrollKey, scrollX, scrollY);

    this._cancelDeferred(scrollKey);
    const attemptScroll = () => {
      const availableScrollX = document.documentElement.scrollWidth - document.documentElement.clientWidth + blockSizeTolerance;
      const availableScrollY = document.documentElement.scrollHeight - document.documentElement.clientHeight + blockSizeTolerance;
      if (availableScrollX >= scrollX && availableScrollY >= scrollY) window.scrollTo(scrollX, scrollY);
      return window.pageXOffset + blockSizeTolerance >= scrollX && window.pageYOffset + blockSizeTolerance >= scrollY;
    };
    if (!attemptScroll()) {
      const failedScroll = () => {
        debug(`Could not scroll ${scrollKey} to (${scrollX}, ${scrollY})` +
          `; scroll size is (${document.documentElement.scrollWidth}, ${document.documentElement.scrollHeight})`);
      };

      const { timeout = defaultTimeout } = this.props;
      if (timeout) {
        debug(`Deferring scroll of ${scrollKey} for up to ${timeout} ms`);
        (this._deferredNodes[scrollKey] = timedMutationObserver(attemptScroll, timeout))
          .then(() => delete this._deferredNodes[scrollKey])
          .catch(e => { if (!e.cancelled) failedScroll() });
      } else {
        failedScroll();
      }
    }
  }

  _restoreInitial() {
    if (!location.hash) {
      this._restoreWindow();
    }
  }

  _cancelDeferred(scrollKey) {
    const deferred = this._deferredNodes[scrollKey];
    if (deferred) {
      debug(`Cancelling deferred scroll of ${scrollKey}`);
      delete this._deferredNodes[scrollKey];
      deferred.cancel();
    }
  }
}

ScrollManager.propTypes = {
  history: PropTypes.object.isRequired,
  sessionKey: PropTypes.string,
  timeout: PropTypes.number,
  children: PropTypes.node,
  // skippingSaveDeferredScroll: PropTypes.bool,
  blockSizeTolerance: PropTypes.number
};

export function withManager(Component) {
  return function ManagedComponent(props) {
    return (
      <ManagerContext.Consumer>
        { manager => <Component {...props} manager={manager} /> }
      </ManagerContext.Consumer>
    )
  }
}
