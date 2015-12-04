import deepEqual from 'deep-equal';

export default function runTests ({funcName, func, tests, expandArguments=false}) {
  funcName = funcName || func.name;
  
  tests.forEach(({input, expected, capability}, testNum) => {
    const result = expandArguments ? func(...input) : func(input);
    if (!deepEqual(result, expected)) {
      console.error(capability || `#${testNum}`);
      console.error(`Expected: ${JSON.stringify(expected,null,2)} but got: ${JSON.stringify(result,null,2)}`);
    }
  });
}
