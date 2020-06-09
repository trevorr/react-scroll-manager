# react-scroll-manager

[![Build Status](https://travis-ci.org/trevorr/react-scroll-manager.svg?branch=master)](https://travis-ci.org/trevorr/react-scroll-manager)
[![npm version](https://badge.fury.io/js/react-scroll-manager.svg)](https://badge.fury.io/js/react-scroll-manager)

## Overview

In a single page application (SPA), the application manipulates the browser history and DOM to simulate navigation.
Because navigation is simulated and rendering is dynamic, the usual browser behavior of restoring scroll position
when navigating back and forth through the history is not generally functional.
While some browsers ([particularly Chrome](https://github.com/brigade/delayed-scroll-restoration-polyfill)) attempt to
support automatic [scroll restoration](https://html.spec.whatwg.org/multipage/history.html#dom-history-scroll-restoration)
in response to history navigation and asynchronous page rendering, this support is still incomplete and inconsistent.
Similarly, SPA router libraries provide varying but incomplete levels of scroll restoration. For example, the current
version of [React Router](https://reacttraining.com/react-router/)
[does not provide scroll management](https://github.com/ReactTraining/react-router/issues/3950),
and older versions did not provide support for all cases.

This library attempts to provide this missing functionality to [React](https://reactjs.org/) applications in a flexible
and mostly router-agnostic way. It supports saving per-location window and element scroll positions to session storage
and automatically restoring them during navigation. It also provides support for the related problem of navigating to
hash links that reference dynamically rendered elements.

## Requirements

This library has the following requirements:

- HTML5 browsers: Only the [browser history API](https://developer.mozilla.org/en-US/docs/Web/API/History_API)
  (not hash history) is supported. Generally, this means [modern browsers or IE 10+](https://caniuse.com/#feat=history).
- React 16 and higher: The modern [Context API](https://reactjs.org/docs/context.html) is used.

The following features of newer browsers are supported with fallbacks for older browsers:

- If [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) is not
  [available](https://caniuse.com/#search=MutationObserver) (e.g. IE 10), the library will fall back to polling.
- [Scroll restoration](https://html.spec.whatwg.org/multipage/history.html#dom-history-scroll-restoration)
  will be set to `manual` if [available](https://developer.mozilla.org/en-US/docs/Web/API/History_API#Browser_compatibility),
  and ignored if not (e.g. IE and Edge).

## Installation

```sh
npm install react-scroll-manager
```

## Example

The following example demonstrates usage of this library with React Router v4.
It includes scroll restoration for both the main content window and a fixed navigation panel.

```js
import React from 'react';
import { Router } from 'react-router-dom';
import { ScrollManager, WindowScroller, ElementScroller } from 'react-scroll-manager';
import { createBrowserHistory as createHistory } from 'history';

class App extends React.Component {
  constructor() {
    super();
    this.history = createHistory();
  }
  render() {
    return (
      <ScrollManager history={this.history}>
        <Router history={this.history}>
          <WindowScroller>
            <ElementScroller scrollKey="nav">
              <div className="nav">
                ...
              </div>
            </ElementScroller>
            <div className="content">
              ...
            </div>
          </WindowScroller>
        </Router>
      </ScrollManager>
    );
  }
}
```

## API

### ScrollManager

The ScrollManager component goes outside of your router component. It enables manual scroll restoration,
reads and writes scroll positions from/to session storage, saves positions before navigation events, handles scrolling
of nested components like WindowScroller and ElementScroller, and performs delayed scrolling to hash links anywhere
within the document. It has the following properties:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| history | object | yes | A [history](https://github.com/ReactTraining/history) object, as returned by `createBrowserHistory` or `createMemoryHistory`. |
| sessionKey | string | no | The key under which session state is stored. Defaults to `ScrollManager`. |
| timeout | number | no | The maximum number of milliseconds to wait for rendering to complete. Defaults to 3000. |

### WindowScroller

The WindowScroller component goes immediately inside your router component. It handles scrolling the window
position after navigation. If your window position never changes (e.g. your layout is fixed and all scrolling
occurs within elements), it need not be used. It has no properties, but must be nested within a ScrollManager.

### ElementScroller

The ElementScroller component goes immediately outside of a scrollable component (e.g. with `overflow: auto` style)
for which you would like to save and restore the scroll position. It must be nested within a ScrollManager and has
the following required property:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| scrollKey | string | yes | The key within the session state under which the element scroll position is stored. |

## Tips

### Use router link elements for hash links within a page

Always be sure to use your router library's link component rather than `<a>` tags when navigating to hash links.
While a link like `<a href="#id">` will navigate to the given element on the current page, it bypasses the usual
call to [`history.pushState`](https://developer.mozilla.org/en-US/docs/Web/API/History_API), which assigns a unique key
to the history location. Without a location key, the library has no way to associate the position with the location,
and scroll restoration won't work for those locations.

```html
  <Link to="#id">...</Link> <!-- right way -->
  <a href="#id">...</a>     <!-- wrong way -->
```

## Acknowledgments

- The concept for this library is based on [react-router-restore-scroll](https://github.com/ryanflorence/react-router-restore-scroll).
- The timed [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) approach to scrolling to hash link
  elements comes from [Gajus Kuizinas](https://medium.com/@gajus/making-the-anchor-links-work-in-spa-applications-618ba2c6954a).
- Thanks to Anders Gissel for [suggesting a fix for IE 11 window scrolling](https://github.com/trevorr/react-scroll-manager/pull/3) and Søren Bruus Frank for [submitting TypeScript definitions](https://github.com/trevorr/react-scroll-manager/pull/2).

## License

`react-scroll-manager` is available under the [ISC license](LICENSE).
