import Immutable from 'immutable';

export default function sliceSegmentByGridIntersections (
  p0,
  p1,

  gridWidth,
  gridHeight,
) {
  const segs = [];
  const vlines = Immutable.range(Math.ceil(p0.x / gridWidth), Math.ceil(p1.x / gridWidth));
  const hlines = Immutable.range(Math.ceil(p0.y / gridHeight), Math.ceil(p1.y / gridHeight));

  return segs;
}

import runTests from './runTests';

const tests = [
  {
    capability: 'should return an empty list when there are no intersections',
    input: [
      {x:1,y:1},
      {x:1,y:1},
      10,
      10,
    ],
    expected: [],
  },

  {
    capability: 'should detect simple horizontal intersections',
    input: [
      {x:1,y:1},
      {x:23,y:1},
      10,
      10,
    ],
    expected: [
      [
        {x:1,y:1},
        {x:10,y:1},
      ],
      [
        {x:10,y:1},
        {x:15,y:1},
      ],
      [
        {x:15,y:1},
        {x:20,y:1},
      ],
      [
        {x:20,y:1},
        {x:23,y:1},
      ],
    ],
  },

  {
    capability: 'should detect simple vertical intersections',
    input: [
      {x:1,y:1},
      {x:1,y:23},
      10,
      10,
    ],
    expected: [
      [
        {x:1,y:1},
        {x:1,y:10},
      ],
      [
        {x:1,y:10},
        {x:1,y:15},
      ],
      [
        {x:1,y:15},
        {x:1,y:20},
      ],
      [
        {x:1,y:20},
        {x:1,y:23},
      ],
    ],
  },
];

// runTests({
//   func: sliceSegmentByGridIntersections,
//   tests,
//   expandArguments: true,
// });