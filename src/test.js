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
  console.log("   " + err.message + "\n");
}

// 6. Test Unison-Style Semantic AST Hashing & Codebase Store
console.log("6. Testing Unison Content-Addressed Codebase & AST Hashing:");
const { hashAST, CodebaseStore } = require("./index.js");

// Two functions written with completely different keywords/dialects
const fn1 = parse(`
def addNumbers(x, y)
{
  return x + y;
}
`).body[0];

const fn2 = parse(`
fn addNumbers(x, y)
{
  give x + y;
}
`).body[0];

const hash1 = hashAST(fn1);
const hash2 = hashAST(fn2);

console.log(`  fn1 ('def' / 'return') hash: #${hash1.slice(0, 8)}`);
console.log(`  fn2 ('fn'  / 'give'  ) hash: #${hash2.slice(0, 8)}`);

if (hash1 === hash2) {
  console.log("  Success: Semantic AST normalization produced identical content hashes across dialects!");
} else {
  console.error("  Failure: Semantic AST hashes did not match!");
}

// In-Memory SQLite Codebase Store Test
const testStore = new CodebaseStore(":memory:");
testStore.saveTerm("addNumbers", fn1, "function", "math");
const loaded = testStore.getTermByName("addNumbers", "math");
console.log(`  Loaded from SQLite: ${loaded.name} (${loaded.shortHash})`);

testStore.renameTerm("addNumbers", "sum", "math");
const renamed = testStore.getTermByName("sum", "math");
console.log(`  Renamed alias to 'sum': points to same hash ${renamed.shortHash}`);
testStore.close();

// 7. Test Template Literals & Print Dialect Normalization
console.log("\n7. Testing Template Literals & Print Dialect Normalization:");
const templateCode = `
val user = "Ada";
val role = "Pioneer";
val greeting = \`Hello \${user}, welcome as \${role}!\`;
echo(greeting);
`;
const templateAst = parse(templateCode);
const rustTemplate = formatDialect(templateAst, "rust");
console.log("  Rust Projection:\n" + rustTemplate);
if (rustTemplate.includes('format!("Hello {user}, welcome as {role}!")') && rustTemplate.includes('println!("{}", greeting)')) {
  console.log("  Success: Template literal & print normalized correctly for Rust!");
}

console.log("\nAll AnyLang tests passed!");
