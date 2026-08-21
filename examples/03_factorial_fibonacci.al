// 03_factorial_fibonacci.al - Recursion and functions with diverse keywords

def factorial(n)
{
  if (n <= 1)
  {
    result 1;
  }
  else
  {
    return n * factorial(n - 1);
  }
}

sub fibonacci(n)
{
  if (n <= 0)
  {
    give 0;
  }
  if (n == 1)
  {
    give 1;
  }
  return fibonacci(n - 1) + fibonacci(n - 2);
}

void printSequence(limit)
{
  int i = 0;
  while (i <= limit)
  {
    puts("fib(" + i + ") = " + fibonacci(i));
    i += 1;
  }
}

fmt.Println("Factorial of 5 is: " + factorial(5));
console.log("Factorial of 6 is: " + factorial(6));

echo("--- Fibonacci Sequence ---");
printSequence(7);
