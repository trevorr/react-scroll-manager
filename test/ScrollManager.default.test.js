import React from 'react';
import { Router } from 'react-router-dom';
import renderer from 'react-test-renderer';
import { createMemoryHistory as createHistory } from 'history';
import { ScrollManager, WindowScroller, ElementScroller } from '../src';
import { mockElement, setScrollLeft, setScrollTop } from './mocks';

test('Default positioning', () => {
  const history = createHistory();
  const tree = renderer.create(
    <ScrollManager history={history}>
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
  expect(window.scrollTo.mock.calls).toEqual([[0, 0]]);
  expect(setScrollLeft.mock.calls).toEqual([[0]]);
  expect(setScrollTop.mock.calls).toEqual([[0]]);
});
