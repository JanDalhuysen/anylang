// 02_math_and_logic.al - Boolean logic, unless/until controls, and keyword generosity

proc checkEligibility(age, hasConsent)
{
  unless (age >= 18 or hasConsent)
  {
    echo("Access denied: Underage without consent.");
    give false;
  }
  otherwise
  {
    System.out.println("Access granted!");
    give true;
  }
}

val user1_allowed = checkEligibility(16, yes);
val user2_allowed = checkEligibility(15, no);

print("User 1 status: " + user1_allowed);
print("User 2 status: " + user2_allowed);

int step = 0;
until (step >= 3)
{
  fmt.Printf("Step in until loop: " + step);
  step += 1;
}
