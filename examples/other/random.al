// Generate random values for hours, minutes, and seconds
const randomHour = Math.floor(Math.random() * 24);
const randomMinute = Math.floor(Math.random() * 60);
const randomSecond = Math.floor(Math.random() * 60);

// Define your specific date and commit message
const targetDate = "2026-08-16";
const commitMessage = "cs244";

// Combine date and random time
const fullDateTime = `${targetDate} ${randomHour}:${randomMinute}:${randomSecond}`;

// Construct the final Windows Command Prompt (CMD) string
const command = `SET GIT_COMMITTER_DATE="${fullDateTime}" && git commit -m "${commitMessage}" --date="${fullDateTime}"`;

console.log(command);
