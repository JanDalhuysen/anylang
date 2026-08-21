// 01_fizzbuzz.al - Classic FizzBuzz in AnyLang Pidgin
// Demonstrates: while loop, when/otherwise, modulo, multiple print styles

fn fizzbuzz(limit)
{
  int i = 1;
  while (i <= limit)
  {
    when (i % 15 == 0)
    {
      fmt.Println("FizzBuzz");
    }
    otherwise
    {
      when (i % 3 == 0)
      {
        echo("Fizz");
      }
      otherwise
      {
        when (i % 5 == 0)
        {
          puts("Buzz");
        }
        otherwise
        {
          print(i);
        }
      }
    }
    i += 1;
  }
}

puts("--- Running FizzBuzz up to 15 ---");
fizzbuzz(15);
