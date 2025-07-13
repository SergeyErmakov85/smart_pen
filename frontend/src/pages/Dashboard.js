import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotes } from '../contexts/NotesContext';
import BluetoothConnection from '../components/BluetoothConnection';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { notes, fetchNotes, loading, createNote, deleteNote } = useNotes();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotes, setFilteredNotes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.text_content?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredNotes(filtered);
    } else {
      setFilteredNotes(notes);
    }
  }, [notes, searchQuery]);

  const handleCreateNote = async () => {
    const newNote = {
      title: 'Новая заметка',
      content: '',
      text_content: ''
    };

    try {
      const createdNote = await createNote(newNote);
      navigate(`/note/${createdNote.id}`);
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту заметку?')) {
      try {
        await deleteNote(noteId);
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPreviewText = (content) => {
    if (!content) return 'Пустая заметка';
    // Extract text from base64 image or show placeholder
    return 'Рукописная заметка';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Smart Pen</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/settings"
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
              
              <button
                onClick={logout}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bluetooth Connection */}
        <BluetoothConnection />

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Поиск заметок..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // Loading skeletons
            Array(6).fill(0).map((_, index) => (
              <div key={index} className="note-card">
                <div className="skeleton h-6 w-3/4 mb-2"></div>
                <div className="skeleton-text w-full mb-2"></div>
                <div className="skeleton-text w-2/3"></div>
              </div>
            ))
          ) : filteredNotes.length > 0 ? (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                className="note-card relative group"
                onClick={() => navigate(`/note/${note.id}`)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {note.title}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">
                  {getPreviewText(note.content)}
                </p>
                
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Изменено: {formatDate(note.updated_at)}</span>
                  {note.google_drive_id && (
                    <span className="text-green-600">📁 Синхронизировано</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Нет заметок
              </h3>
              <p className="text-gray-600 mb-6">
                Создайте свою первую заметку с помощью Neo Smartpen
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleCreateNote}
        className="floating-button"
        aria-label="Создать новую заметку"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};

export default Dashboard;