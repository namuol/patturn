// @flow
import splitSegmentsAtTileBoundaries from './splitSegmentsAtTileBoundaries';

it('returns a _set_ of paths', () => {
  // prettier-ignore
  const points = [
    {x: 10, y: 10},
    {x: 20, y: 20},
  ];

  expect(
    splitSegmentsAtTileBoundaries({
      path: {points},
      tileWidth: 100,
      tileHeight: 100,
    }),
  ).toEqual([{points}]);
});

it('splits the path into 3 when crossing from the left', () => {
  // prettier-ignore
  const points = [
    {x: 20, y: 0},
    {x: 10, y: 0},
    {x: -10, y: 0},
    {x: -20, y: 0},
  ];

  expect(
    splitSegmentsAtTileBoundaries({
      path: {points},
      tileWidth: 100,
      tileHeight: 100,
    }),
  ).toMatchSnapshot();
});

it('splits the path into 3 when crossing from the right', () => {
  // prettier-ignore
  const points = [
    {x: -20, y: 0},
    {x: -10, y: 0},
    {x: 10, y: 0},
    {x: 20, y: 0},
  ];

  expect(
    splitSegmentsAtTileBoundaries({
      path: {points},
      tileWidth: 100,
      tileHeight: 100,
    }),
  ).toMatchSnapshot();
});

it('splits the path into 3 when crossing from the left far inside the grid', () => {
  // prettier-ignore
  const points = [
    {x: 500 + 20, y: 0},
    {x: 500 + 10, y: 0},
    {x: 500 + -10, y: 0},
    {x: 500 + -20, y: 0},
  ];

  expect(
    splitSegmentsAtTileBoundaries({
      path: {points},
      tileWidth: 100,
      tileHeight: 100,
    }),
  ).toMatchSnapshot();
});

it('splits the path into 3 when crossing from the right far inside the grid', () => {
  // prettier-ignore
  const points = [
    {x: 500 + -20, y: 0},
    {x: 500 + -10, y: 0},
    {x: 500 + 10, y: 0},
    {x: 500 + 20, y: 0},
  ];

  expect(
    splitSegmentsAtTileBoundaries({
      path: {points},
      tileWidth: 100,
      tileHeight: 100,
    }),
  ).toMatchSnapshot();
});

// Vertical

it('splits the path into 3 when crossing from the bottom', () => {
  // prettier-ignore
  const points = [
    {x: 0, y: 20},
    {x: 0, y: 10},
    {x: 0, y: -10},
    {x: 0, y: -20},
  ];

  expect(
    splitSegmentsAtTileBoundaries({
      path: {points},
      tileWidth: 100,
      tileHeight: 100,
    }),
  ).toMatchSnapshot();
});

it('splits the path into 3 when crossing from the top', () => {
  // prettier-ignore
  const points = [
    {x: 0, y: -20},
    {x: 0, y: -10},
    {x: 0, y: 10},
    {x: 0, y: 20},
  ];

  expect(
    splitSegmentsAtTileBoundaries({
      path: {points},
      tileWidth: 100,
      tileHeight: 100,
    }),
  ).toMatchSnapshot();
});

it('splits the path into 3 when crossing from the bottom far inside the grid', () => {
  // prettier-ignore
  const points = [
    {x: 0, y: 500 + 20},
    {x: 0, y: 500 + 10},
    {x: 0, y: 500 + -10},
    {x: 0, y: 500 + -20},
  ];

  expect(
    splitSegmentsAtTileBoundaries({
      path: {points},
      tileWidth: 100,
      tileHeight: 100,
    }),
  ).toMatchSnapshot();
});

it('splits the path into 3 when crossing from the top far inside the grid', () => {
  // prettier-ignore
  const points = [
    {x: 0, y: 500 + -20},
    {x: 0, y: 500 + -10},
    {x: 0, y: 500 + 10},
    {x: 0, y: 500 + 20},
  ];

  expect(
    splitSegmentsAtTileBoundaries({
      path: {points},
      tileWidth: 100,
      tileHeight: 100,
    }),
  ).toMatchSnapshot();
});
