import React from 'react';
import { Router } from 'react-router-dom';
import renderer from 'react-test-renderer';
import { createMemoryHistory as createHistory } from 'history';
import { ScrollManager, WindowScroller, ElementScroller } from '../src';
import { mockElement, setScrollLeft, setScrollTop } from './mocks';

const locationKey = 'abcdef';
window.sessionStorage.setItem('scroll', JSON.stringify({
  positions: {
    [locationKey]: {
      window: {
        scrollX: 10,
        scrollY: 20
      },
      main: {
        scrollLeft: 30,
        scrollTop: 40
      }
    }
  },
  locations: [locationKey],
  locationKey
}));

test('Stored positioning', () => {
  const history = createHistory();
  const tree = renderer.create(
    <ScrollManager history={history} sessionKey="scroll">
      <Router history={history}>
        <WindowScroller>
          <ElementScroller scrollKey="main">
            <div></div>
          </ElementScroller>
        </WindowScroller>
      </Router>
    </ScrollManager>,
    {
      createNodeMock() {
        return mockElement;
      }
    }
  );

  expect(tree.toJSON()).toEqual({ type: 'div', props: {}, children: null });
  expect(window.scrollTo.mock.calls).toEqual([[10, 20]]);
  expect(setScrollLeft.mock.calls).toEqual([[30]]);
  expect(setScrollTop.mock.calls).toEqual([[40]]);
});
