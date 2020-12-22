window.scrollTo = jest.fn();

export const getScrollLeft = jest.fn(() => 0);
export const setScrollLeft = jest.fn();
export const getScrollTop = jest.fn(() => 0);
export const setScrollTop = jest.fn();
export const mockElement = Object.create(null, {
  scrollLeft: {
    enumerable: true,
    get: getScrollLeft,
    set: setScrollLeft
  },
  scrollTop: {
    enumerable: true,
    get: getScrollTop,
    set: setScrollTop
  },
  scrollWidth: {
    enumerable: true,
    get: jest.fn(() => 500)
  },
  clientWidth: {
    enumerable: true,
    get: jest.fn(() => 250)
  },
  scrollHeight: {
    enumerable: true,
    get: jest.fn(() => 500)
  },
  clientHeight: {
    enumerable: true,
    get: jest.fn(() => 250)
  }
});
