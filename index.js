const quotes = [
  "Stay hungry, stay foolish. — Steve Jobs",
  "Talk is cheap. Show me the code. — Linus Torvalds",
  "Simplicity is the ultimate sophistication. — Leonardo da Vinci",
  "The best way to predict the future is to invent it. — Alan Kay",
  "行胜于言 — 清华大学校训",
];

const quoteEl = document.getElementById("quote");
let index = 0;

function showQuote() {
  quoteEl.textContent = quotes[index];
  quoteEl.style.opacity = "1";
}

function nextQuote() {
  quoteEl.style.opacity = "0";
  setTimeout(() => {
    index = (index + 1) % quotes.length;
    quoteEl.textContent = quotes[index];
    quoteEl.style.opacity = "1";
  }, 500);
}

showQuote();
setInterval(nextQuote, 5000);
