/*
BooksApp.jsx
A single-file React component (default export) that implements a massive, responsive,
animated frontend to manage the in-memory Books REST API you created earlier.

Features:
- Responsive layout (mobile/tablet/desktop)
- Hero header and action bar
- Animated book cards grid
- Create / Edit modal with validation
- Delete confirmation with animation
- Search, sort, and client-side pagination
- Lightweight loading and error states
- Uses Tailwind utility classes (assumes Tailwind is configured)
- Uses framer-motion for animations

Dependencies to install:
- react, react-dom
- framer-motion
- Tailwind CSS configured in your project

Example setup (if using Vite + React + Tailwind):
1. npm create vite@latest my-app --template react
2. cd my-app
3. npm install
4. npm install framer-motion
5. Follow Tailwind install guide: https://tailwindcss.com/docs/guides/vite
6. Replace App.jsx contents with this file and start dev server: npm run dev

API base (assumes your Node server is running at http://localhost:3000):
- GET /books
- POST /books
- PUT /books/:id
- DELETE /books/:id


*/

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:3000'; // change if your API runs elsewhere

export default function BooksApp() {
  // Data
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('id-desc');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);

  // Delete confirm
  const [deleting, setDeleting] = useState(null);

  // Flash message
  const [toast, setToast] = useState(null);

  // Form fields
  const emptyForm = { title: '', author: '' };
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});

  // Fetch books
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/books`);
        if (!res.ok) throw new Error('Failed to fetch books');
        const data = await res.json();
        if (mounted) setBooks(data);
      } catch (err) {
        if (mounted) setError(err.message || 'Unknown error');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Derived: filtered + sorted
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = books.slice();
    if (q) {
      arr = arr.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
    }
    const [fld, dir] = sortBy.split('-');
    arr.sort((a, b) => {
      if (fld === 'title') {
        return dir === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      }
      if (fld === 'author') {
        return dir === 'asc' ? a.author.localeCompare(b.author) : b.author.localeCompare(a.author);
      }
      // default by id
      return dir === 'asc' ? a.id - b.id : b.id - a.id;
    });
    return arr;
  }, [books, query, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages]);
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Helpers for toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // CRUD actions
  async function createBook(payload) {
    // optimistic - show loader
    try {
      const res = await fetch(`${API_BASE}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create book');
      const created = await res.json();
      setBooks(prev => [...prev, created]);
      setToast({ type: 'success', message: 'Book added' });
      return created;
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to add' });
      throw err;
    }
  }

  async function updateBook(payload) {
    try {
      const res = await fetch(`${API_BASE}/books/${payload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update book');
      const updated = await res.json();
      setBooks(prev => prev.map(b => (b.id === updated.id ? updated : b)));
      setToast({ type: 'success', message: 'Book updated' });
      return updated;
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to update' });
      throw err;
    }
  }

  async function removeBook(id) {
    try {
      const res = await fetch(`${API_BASE}/books/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      // update local
      setBooks(prev => prev.filter(b => b.id !== id));
      setToast({ type: 'success', message: 'Book deleted' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to delete' });
      throw err;
    }
  }

  // Form open for create or edit
  function openCreate() {
    setEditingBook(null);
    setForm(emptyForm);
    setFormErrors({});
    setIsFormOpen(true);
  }
  function openEdit(book) {
    setEditingBook(book);
    setForm({ title: book.title, author: book.author });
    setFormErrors({});
    setIsFormOpen(true);
  }

  // Validate form
  function validateForm() {
    const errs = {};
    if (!form.title || form.title.trim().length < 2) errs.title = 'Title should be at least 2 chars';
    if (!form.author || form.author.trim().length < 3) errs.author = 'Author should be at least 3 chars';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submitForm(e) {
    e.preventDefault();
    if (!validateForm()) return;
    const payload = { title: form.title.trim(), author: form.author.trim() };
    try {
      if (editingBook) {
        await updateBook({ id: editingBook.id, ...payload });
      } else {
        await createBook(payload);
      }
      setIsFormOpen(false);
    } catch (err) {
      // errors handled in helpers
    }
  }

  // Small UI components
  const IconAdd = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const BookCard = ({ book }) => (
    <motion.div layout whileHover={{ y: -6 }} className="bg-gradient-to-br from-white/80 to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-lg rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-slate-400 text-xs">ID #{book.id}</div>
          <h3 className="font-semibold text-lg truncate">{book.title}</h3>
          <p className="text-sm text-slate-500 mt-1">by {book.author}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button onClick={() => openEdit(book)} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm">Edit</button>
          <button onClick={() => setDeleting(book)} className="px-3 py-2 rounded-lg bg-rose-100 hover:bg-rose-200 text-sm">Delete</button>
        </div>
      </div>
    </motion.div>
  );

  // Compose the page
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-slate-900 dark:to-slate-800 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Books Manager</h1>
            <p className="mt-1 text-slate-600 dark:text-slate-300">Create, update, and explore your books — beautifully and responsively.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                <IconAdd />
                <span className="font-medium">Add Book</span>
              </button>
            </div>

            <div className="block md:hidden">
              <button onClick={openCreate} className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                <IconAdd />
              </button>
            </div>

            <div className="ml-2">
              <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search title or author..." className="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
          </div>
        </header>

        {/* Controls */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600">Sort</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200">
              <option value="id-desc">Newest</option>
              <option value="id-asc">Oldest</option>
              <option value="title-asc">Title A→Z</option>
              <option value="title-desc">Title Z→A</option>
              <option value="author-asc">Author A→Z</option>
              <option value="author-desc">Author Z→A</option>
            </select>

            <div className="hidden md:block text-sm text-slate-600">{filtered.length} books • page {page}/{totalPages}</div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => { setQuery(''); setSortBy('id-desc'); setPage(1); }} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200">Reset</button>
            <button onClick={() => { setPage(p => Math.max(1, p - 1)); }} className="px-3 py-2 rounded-lg bg-white border">Prev</button>
            <button onClick={() => { setPage(p => Math.min(totalPages, p + 1)); }} className="px-3 py-2 rounded-lg bg-white border">Next</button>
          </div>
        </motion.div>

        {/* Content */}
        <main>
          {loading ? (
            <div className="py-20 text-center">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2 }} className="inline-block w-12 h-12 rounded-full border-4 border-indigo-300 border-t-indigo-600" />
              <div className="mt-4 text-slate-600">Loading books...</div>
            </div>
          ) : error ? (
            <div className="py-10 text-center text-rose-600">{error}</div>
          ) : (
            <>
              {filtered.length === 0 ? (
                <div className="py-20 text-center text-slate-600">
                  No books found. Try adding a new book.
                </div>
              ) : (
                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <AnimatePresence>
                    {pageItems.map(book => (
                      <motion.div key={book.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                        <BookCard book={book} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </>
          )}
        </main>

        {/* Pagination footer */}
        <footer className="mt-8 flex items-center justify-between">
          <div className="text-sm text-slate-500">Showing {Math.min(filtered.length, (page - 1) * pageSize + 1)}–{Math.min(filtered.length, page * pageSize)} of {filtered.length} books</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(1)} className="px-3 py-1 rounded-md border">First</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded-md border">Prev</button>
            <div className="px-3 py-1 rounded-md border bg-white">{page}</div>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1 rounded-md border">Next</button>
            <button onClick={() => setPage(totalPages)} className="px-3 py-1 rounded-md border">Last</button>
          </div>
        </footer>

      </div>

      {/* Floating Add Button for large screens */}
      <div className="fixed right-6 bottom-6 md:block hidden">
        <button onClick={openCreate} className="flex items-center gap-3 px-4 py-3 rounded-full bg-indigo-600 shadow-xl text-white">
          <IconAdd />
          <span className="font-medium">Add Book</span>
        </button>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ y: 20, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 10, scale: 0.98 }} transition={{ type: 'spring' }} className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 border">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{editingBook ? 'Edit Book' : 'Add New Book'}</h2>
                  <p className="text-sm text-slate-500">{editingBook ? 'Update the details and save changes.' : 'Fill in the information to create a new book.'}</p>
                </div>
                <button onClick={() => setIsFormOpen(false)} className="text-slate-500">✕</button>
              </div>

              <form onSubmit={submitForm} className="space-y-3">
                <div>
                  <label className="text-sm">Title</label>
                  <input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className={`mt-1 w-full px-3 py-2 rounded-lg border ${formErrors.title ? 'border-rose-400' : 'border-slate-200'}`} />
                  {formErrors.title && <div className="text-rose-500 text-sm mt-1">{formErrors.title}</div>}
                </div>
                <div>
                  <label className="text-sm">Author</label>
                  <input value={form.author} onChange={(e) => setForm(f => ({ ...f, author: e.target.value }))} className={`mt-1 w-full px-3 py-2 rounded-lg border ${formErrors.author ? 'border-rose-400' : 'border-slate-200'}`} />
                  {formErrors.author && <div className="text-rose-500 text-sm mt-1">{formErrors.author}</div>}
                </div>

                <div className="flex items-center justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white">{editingBook ? 'Save changes' : 'Create book'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ y: 10 }} animate={{ y: 0 }} exit={{ y: 10 }} className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 border">
              <h3 className="text-lg font-semibold">Delete book</h3>
              <p className="text-sm text-slate-600 mt-2">Are you sure you want to delete "{deleting.title}"? This action can't be undone.</p>

              <div className="flex items-center justify-end gap-3 mt-4">
                <button onClick={() => setDeleting(null)} className="px-3 py-2 rounded-lg border">Cancel</button>
                <button onClick={async () => { try { await removeBook(deleting.id); setDeleting(null); } catch (e) { /* handled */ } }} className="px-3 py-2 rounded-lg bg-rose-600 text-white">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={`fixed left-1/2 transform -translate-x-1/2 bottom-8 z-50`}>
            <div className={`px-4 py-2 rounded-lg shadow-md ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
