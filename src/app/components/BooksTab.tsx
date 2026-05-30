"use client";

import React, { useState, useMemo } from 'react';

interface BookItem {
  id: string;
  title: string;
  author: string;
  genre: string;
  status: 'Plan to Read' | 'Reading' | 'Completed';
  currentPage: number;
  totalPages: number;
  rating: number;
}

export default function BooksTab({ appState }: { appState?: any }) {
  const [books, setBooks] = useState<BookItem[]>(
    [
      { id: '1', title: 'Dune', author: 'Frank Herbert', genre: 'Sci-Fi', status: 'Reading', currentPage: 180, totalPages: 500, rating: 0 },
      { id: '2', title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Improvement', status: 'Completed', currentPage: 320, totalPages: 320, rating: 5 },
      { id: '3', title: 'Meditations', author: 'Marcus Aurelius', genre: 'Philosophy', status: 'Plan to Read', currentPage: 0, totalPages: 250, rating: 0 }
    ]
  );

  const [filterStatus, setFilterStatus] = useState<string>('All');
  
  // Creation States
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('Fiction');
  const [totalPages, setTotalPages] = useState(300);

  const handleSyncGoodreads = () => {
    alert("Goodreads CSV or Native Backup Import Parser Hook Activated.");
  };

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    if(!title.trim() || !author.trim()) return;

    const newBook: BookItem = {
      id: Date.now().toString(),
      title,
      author,
      genre,
      status: 'Plan to Read',
      currentPage: 0,
      totalPages: totalPages || 1,
      rating: 0
    };

    setBooks([newBook, ...books]);
    setTitle('');
    setAuthor('');
    setTotalPages(300);
    setShowAddForm(false);
  };

  const updatePages = (id: string, pages: number) => {
    setBooks(books.map(b => {
      if (b.id !== id) return b;
      const targetPage = Math.max(0, Math.min(pages, b.totalPages));
      const targetStatus = targetPage === b.totalPages ? 'Completed' : targetPage > 0 ? 'Reading' : 'Plan to Read';
      return { ...b, currentPage: targetPage, status: targetStatus as BookItem['status'] };
    }));
  };

  const setBookRating = (id: string, rating: number) => {
    setBooks(books.map(b => b.id === id ? { ...b, rating } : b));
  };

  const removeBook = (id: string) => {
    setBooks(books.filter(b => b.id !== id));
  };

  const filteredBooks = useMemo(() => {
    return books.filter(b => filterStatus === 'All' || b.status === filterStatus);
  }, [books, filterStatus]);

  return (
    <div className="flex flex-col h-full text-neutral-300 p-4">
      
      {/* Header Controls toolbar */}
      <div className="flex justify-between items-center mb-6 gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold text-white transition-colors outline-none shadow-md"
          >
            {showAddForm ? '✕ Close Form' : '＋ Add Book Log'}
          </button>
          
          <div className="flex bg-neutral-800/40 border border-neutral-800/60 rounded-md p-0.5">
            {['All', 'Plan to Read', 'Reading', 'Completed'].map((tab) => (
              <button
                key={tab} onClick={() => setFilterStatus(tab)}
                className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${filterStatus === tab ? 'bg-neutral-800 text-neutral-100 shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Goodreads Integration Placeholder */}
        <button 
          onClick={handleSyncGoodreads}
          className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/40 hover:border-neutral-600 rounded-lg text-xs font-semibold text-neutral-300 transition-all"
        >
          <span className="w-2 h-2 rounded-full bg-amber-600" />
          Sync Goodreads
        </button>
      </div>

      {/* Creation Dropdown Sheet Form */}
      {showAddForm && (
        <form onSubmit={handleAddBook} className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end shadow-2xl animate-fadeIn">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1.5">Book Title</label>
            <input type="text" placeholder="Title..." value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200 focus:border-neutral-700 outline-none" required />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1.5">Author Name</label>
            <input type="text" placeholder="Author..." value={author} onChange={e => setAuthor(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200 focus:border-neutral-700 outline-none" required />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1.5">Genre / Subject</label>
            <input type="text" placeholder="e.g. History, Sci-Fi" value={genre} onChange={e => setGenre(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200 focus:border-neutral-700 outline-none" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1.5">Total Pages</label>
            <input type="number" min={1} value={totalPages} onChange={e => setTotalPages(parseInt(e.target.value) || 1)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200 focus:border-neutral-700 outline-none" />
          </div>
          <button type="submit" className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 font-semibold text-xs rounded-lg text-neutral-200 transition-colors border border-neutral-700/50">Log Book</button>
        </form>
      )}

      {/* Book Inventory Scroll-list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-6">
        {filteredBooks.length === 0 ? (
          <div className="text-center py-12 text-neutral-600 text-sm font-medium tracking-wide">No reading materials located in this category.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredBooks.map((book) => {
              const isFinished = book.status === 'Completed';
              const percentage = Math.round((book.currentPage / book.totalPages) * 100) || 0;
              
              return (
                <div key={book.id} className={`p-4 border rounded-xl flex flex-col justify-between bg-neutral-900/80 transition-all ${isFinished ? 'border-neutral-900 opacity-60' : 'border-neutral-800/80 shadow-md'}`}>
                  <div>
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/10">
                        {book.genre}
                      </span>
                      <button onClick={() => removeBook(book.id)} className="text-neutral-600 hover:text-rose-400 text-base leading-none transition-colors outline-none" title="Delete">×</button>
                    </div>

                    <h3 className={`font-bold text-sm text-neutral-200 truncate ${isFinished ? 'line-through text-neutral-500' : ''}`} title={book.title}>
                      {isFinished && <span className="text-emerald-500 mr-1 font-bold">✓</span>}
                      {book.title}
                    </h3>
                    <p className="text-xs text-neutral-500 font-medium truncate">by {book.author}</p>
                  </div>

                  {/* Operational Reading Speed Engine Metric */}
                  <div className="mt-4 pt-3 border-t border-neutral-800/60">
                    <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 mb-1.5">
                      <span>Completion</span>
                      <span>{percentage}%</span>
                    </div>

                    {/* Progress Bar container */}
                    <div className="w-full h-1 bg-neutral-950 rounded-full overflow-hidden mb-3">
                      <div className="h-full bg-emerald-500 transition-all" style={{ width: `${percentage}%` }} />
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] text-neutral-500 font-medium whitespace-nowrap">Page marker:</span>
                      <input 
                        type="number" min={0} max={book.totalPages}
                        value={book.currentPage} onChange={e => updatePages(book.id, parseInt(e.target.value) || 0)}
                        className="w-16 bg-neutral-950 border border-neutral-800 rounded px-1.5 py-0.5 text-center text-xs font-mono text-neutral-300 focus:border-neutral-700 outline-none"
                      />
                      <span className="text-[10px] font-mono text-neutral-600">/ {book.totalPages}</span>
                    </div>

                    {/* Interactive Star Array */}
                    <div className="flex justify-between items-center pt-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button 
                            key={val} onClick={() => setBookRating(book.id, val)}
                            className={`text-xs outline-none transition-colors ${val <= book.rating ? 'text-amber-400' : 'text-neutral-700 hover:text-neutral-500'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <span className="text-[9px] font-semibold text-neutral-600 uppercase tracking-wider">{book.status}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}