// @flow
import splitSegmentsAtTileBoundaries from './splitSegmentsAtTileBoundaries';

it('returns a _set_ of paths', () => {
  // prettier-ignore
  const points = [
    [10, 10],
    [20, 20],
  ];

  expect(
    splitSegmentsAtTileBoundaries({
      path: {points},
      tileWidth: 100,
      tileHeight: 100,
    })
  ).toEqual([{points}]);
});

it('splits the path into 3 when crossing from the left', () => {
  // prettier-ignore
  const points = [
    [20, 0],
    [10, 0],
    [-10, 0],
    [-20, 0],
  ];

  expect(
    splitSegmentsAtTileBoundaries({
      path: {points},
      tileWidth: 100,
      tileHeight: 100,
    })
  ).toMatchSnapshot();
});

it('splits the path into 3 when crossing from the right', () => {
  // prettier-ignore
  const points = [
    [-20, 0],
    [-10, 0],
    [10, 0],
    [20, 0],
  ];

  expect(
    splitSegmentsAtTileBoundaries({
      path: {points},
      tileWidth: 100,
      tileHeight: 100,
    })
  ).toMatchSnapshot();
});

it('splits the path into 3 when crossing from the left far inside the grid', () => {
  // prettier-ignore
  const points = [
    [500 + 20, 0],
    [500 + 10, 0],
    [500 + -10, 0],
    [500 + -20, 0],
  ];

  expect(
    splitSegmentsAtTileBoundaries({
      path: {points},
      tileWidth: 100,
      tileHeight: 100,
    })
  ).toMatchSnapshot();
});

it('splits the path into 3 when crossing from the right far inside the grid', () => {
  // prettier-ignore
  const points = [
    [500 + -20, 0],
    [500 + -10, 0],
    [500 + 10, 0],
    [500 + 20, 0],
  ];

  expect(
    splitSegmentsAtTileBoundaries({
      path: {points},
      tileWidth: 100,
      tileHeight: 100,
    })
  ).toMatchSnapshot();
});

// Vertical

it('splits the path into 3 when crossing from the bottom', () => {
  // prettier-ignore
  const points = [
    [0, 20],
    [0, 10],
    [0, -10],
    [0, -20],
  ];

  expect(
    splitSegmentsAtTileBoundaries({
      path: {points},
      tileWidth: 100,
      tileHeight: 100,
    })
  ).toMatchSnapshot();
});

it('splits the path into 3 when crossing from the top', () => {
  // prettier-ignore
  const points = [
    [0, -20],
    [0, -10],
    [0, 10],
    [0, 20],
  ];

  expect(
    splitSegmentsAtTileBoundaries({
      path: {points},
      tileWidth: 100,
      tileHeight: 100,
    })
  ).toMatchSnapshot();
});

it('splits the path into 3 when crossing from the bottom far inside the grid', () => {
  // prettier-ignore
  const points = [
    [0, 500 + 20],
    [0, 500 + 10],
    [0, 500 + -10],
    [0, 500 + -20],
  ];

  expect(
    splitSegmentsAtTileBoundaries({
      path: {points},
      tileWidth: 100,
      tileHeight: 100,
    })
  ).toMatchSnapshot();
});

it('splits the path into 3 when crossing from the top far inside the grid', () => {
  // prettier-ignore
  const points = [
    [0, 500 + -20],
    [0, 500 + -10],
    [0, 500 + 10],
    [0, 500 + 20],
  ];

  expect(
    splitSegmentsAtTileBoundaries({
      path: {points},
      tileWidth: 100,
      tileHeight: 100,
    })
  ).toMatchSnapshot();
});
