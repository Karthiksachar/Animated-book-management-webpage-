const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory storage
let books = [
  { id: 1, title: "The Hobbit", author: "J.R.R. Tolkien" },
  { id: 2, title: "1984", author: "George Orwell" }
];

// GET all books
app.get("/books", (req, res) => {
  res.json(books);
});

// POST new book
app.post("/books", (req, res) => {
  const { title, author } = req.body;
  const newBook = { id: Date.now(), title, author };
  books.push(newBook);
  res.status(201).json(newBook);
});

// PUT update book by ID
app.put("/books/:id", (req, res) => {
  const { id } = req.params;
  const { title, author } = req.body;
  const bookIndex = books.findIndex(b => b.id == id);

  if (bookIndex !== -1) {
    books[bookIndex] = { id: Number(id), title, author };
    res.json(books[bookIndex]);
  } else {
    res.status(404).json({ message: "Book not found" });
  }
});

// DELETE book by ID
app.delete("/books/:id", (req, res) => {
  const { id } = req.params;
  books = books.filter(b => b.id != id);
  res.json({ message: "Book deleted" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
