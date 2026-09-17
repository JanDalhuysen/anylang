// Test suite for AnyLang For Loops (C-style and For-In/Foreach)
const { parse, run, formatDialect, hashAST } = require("../src/index.js");

console.log("--- 1. Testing C-Style For Loop ---");
const cStyleCode = `
int sum = 0;
for (int i = 1; i <= 5; i += 1)
{
  sum += i;
}
print("Sum 1..5:", sum);
`;
let logs = [];
run(cStyleCode, { print: (...a) => logs.push(a.join(" ")) });
console.log("Output:", logs.join("\n"));
if (logs[0] !== "Sum 1..5: 15") {
  throw new Error("C-style for loop output mismatch: " + logs[0]);
}

console.log("\n--- 2. Testing For-In Iteration Loop with Array ---");
const forInCode = `
let total = 0;
let numbers = [10, 20, 30];
for (n in numbers)
{
  total += n;
}
print("Total:", total);
`;
logs = [];
run(forInCode, { print: (...a) => logs.push(a.join(" ")) });
console.log("Output:", logs.join("\n"));
if (logs[0] !== "Total: 60") {
  throw new Error("For-in array output mismatch: " + logs[0]);
}

console.log("\n--- 3. Testing For-In Iteration with range() ---");
const forInRangeCode = `
let squares = [];
for (x in range(1, 6))
{
  squares.push(x * x);
}
print("Squares:", squares.join(", "));
`;
logs = [];
run(forInRangeCode, { print: (...a) => logs.push(a.join(" ")) });
console.log("Output:", logs.join("\n"));
if (logs[0] !== "Squares: 1, 4, 9, 16, 25") {
  throw new Error("For-in range output mismatch: " + logs[0]);
}

console.log("\n--- 4. Testing Dialect Projections of For-In ---");
const ast = parse(forInCode);
console.log("[Pythonic projection]:\n" + formatDialect(ast, "pythonic"));
console.log("[Rust projection]:\n" + formatDialect(ast, "rust"));
console.log("[C# projection]:\n" + formatDialect(ast, "csharp"));
console.log("[Java projection]:\n" + formatDialect(ast, "java"));
console.log("[JS projection]:\n" + formatDialect(ast, "javascript"));

console.log("\n--- 5. Testing Content Hashing Equivalence ---");
const codeA = `
def loopA(items)
{
  for (item in items)
  {
    print(item);
  }
}
`;
const codeB = `
fn loopA(items)
{
  foreach (let item of items)
  {
    print(item);
  }
}
`;
const astA = parse(codeA);
const astB = parse(codeB);
const hashA = hashAST(astA.body[0]);
const hashB = hashAST(astB.body[0]);
console.log("Code A (for..in) hash:     ", hashA);
console.log("Code B (foreach..of) hash: ", hashB);
console.log("Identical hashes?", hashA === hashB);
if (hashA !== hashB) {
  throw new Error("AST hashes do not match across for / foreach dialects");
}

console.log("\nAll For Loop tests passed with flying colors!");
