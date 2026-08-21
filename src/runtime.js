// AnyLang Universal Runtime Environment
// Provides seamless multi-language standard library aliases

const runtime = {
  // Universal Output Functions
  print: (...args) => console.log(...args),
  println: (...args) => console.log(...args),
  echo: (...args) => console.log(...args),
  puts: (...args) => console.log(...args),
  printf: (fmt, ...args) => console.log(fmt, ...args),

  // Object-oriented aliases
  System: {
    out: {
      println: (...args) => console.log(...args),
      print: (...args) => console.log(...args),
    },
  },

  fmt: {
    Println: (...args) => console.log(...args),
    Print: (...args) => console.log(...args),
    Printf: (f, ...args) => console.log(f, ...args),
  },

  console: console,

  // Collection & utility helpers
  len: (item) => (item && item.length !== undefined ? item.length : 0),
  size: (item) => (item && item.length !== undefined ? item.length : 0),
  count: (item) => (item && item.length !== undefined ? item.length : 0),
  str: (val) => String(val),
  int: (val) => parseInt(val, 10),
  float: (val) => parseFloat(val),
  range: (start, end) => {
    if (end === undefined) {
      end = start;
      start = 0;
    }
    const result = [];
    for (let i = start; i < end; i++) {
      result.push(i);
    }
    return result;
  },
};

module.exports = runtime;
