// 04_random_commit.al - Template Literals & JavaScript Math utilities

// Generate random values for hours, minutes, and seconds
const randomHour = Math.floor(Math.random() * 24);
const randomMinute = Math.floor(Math.random() * 60);
const randomSecond = Math.floor(Math.random() * 60);

// Define specific date and commit message
const targetDate = "2026-08-16";
const commitMessage = "cs244";

// Combine date and random time using backtick template strings
const fullDateTime = `${targetDate} ${randomHour}:${randomMinute}:${randomSecond}`;

// Construct the final Windows Command Prompt string
const command = `SET GIT_COMMITTER_DATE="${fullDateTime}" && git commit -m "${commitMessage}" --date="${fullDateTime}"`;

echo("Generated Command:");
console.log(command);
