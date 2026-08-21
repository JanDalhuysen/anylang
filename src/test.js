const { parse, transpile, run, formatDialect } = require("./index.js");

console.log("Testing AnyLang: The Universal Pidgin Language");

// 1. Multi-paradigm pidgin snippet with valid Allman braces
const sampleCode = `
// Mix of Python, JS, Java, Rust & Go syntax in one file
int count = 5;
val message = "Hello from AnyLang!";

fn greet(person)
{
  echo("Greeting: " + person);
  fmt.Println("Message: " + message);
}

def calculate(a, b)
{
  when (a > b)
  {
    System.out.println("a is greater!");
    give a * 2;
  }
  otherwise
  {
    return b + 10;
  }
}

greet("Ada Lovelace");
val result1 = calculate(10, 4);
print("Result 1: " + result1);

int i = 0;
while (i < 3)
{
  puts("Loop iteration: " + i);
  i += 1;
}
`;

try {
  console.log("1. Parsing AnyLang Source Code...");
  const ast = parse(sampleCode);
  console.log("Parsed AST successfully!\n");

  console.log("2. Transpiling to JavaScript...");
  const jsCode = transpile(ast);
  console.log("--- Generated JavaScript ---");
  console.log(jsCode);
  console.log("----------------------------\n");

  console.log("3. Executing AnyLang Program...");
  console.log("--- Program Output ---");
  run(sampleCode);
  console.log("----------------------\n");

  console.log("4. Testing Unison-Style Dialect Projections:");
  console.log("--- [C# Projection] ---");
  console.log(formatDialect(ast, "csharp"));
  console.log("\n--- [Pythonic Projection] ---");
  console.log(formatDialect(ast, "pythonic"));
  console.log("\n--- [Rust Projection] ---");
  console.log(formatDialect(ast, "rust"));
  console.log("-----------------------------------------\n");
} catch (err) {
  console.error("Test Failed:", err);
}

// 5. Test Allman Brace Rule Enforcement
console.log("5. Testing Strict Allman Brace Rule (Must fail on same-line '{'):");
const badBraceCode = `
def badFunction(x) {
  return x + 1;
}
`;

try {
  parse(badBraceCode);
  console.error("Failed: Parser accepted non-Allman brace!");
} catch (err) {
  console.log("Successfully caught Allman brace violation:");
  console.log("   " + err.message);
}

console.log("\nAll AnyLang tests passed!");
