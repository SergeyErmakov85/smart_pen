@@ .. @@
   const fetchNotes = useCallback(async () => {
     if (!token) return;

     setLoading(true);
     setError(null);

     try {
       const response = await axios.get(`${API_URL}/api/notes`, {
         headers: { Authorization: `Bearer ${token}` }
       });
       setNotes(response.data);
     } catch (err) {
       setError(err.response?.data?.detail || 'Ошибка загрузки заметок');
       console.error('Error fetching notes:', err);
     } finally {
       setLoading(false);
     }
-  }, [token, API_URL]);
+  }, [token, API_URL]);

   const createNote = useCallback(async (noteData) => {
     if (!token) return;

     setLoading(true);
     setError(null);

     try {
       const response = await axios.post(`${API_URL}/api/notes`, noteData, {
         headers: { Authorization: `Bearer ${token}` }
       });
       
       const newNote = response.data;
       setNotes(prev => [newNote, ...prev]);
       setCurrentNote(newNote);
       
       return newNote;
     } catch (err) {
       setError(err.response?.data?.detail || 'Ошибка создания заметки');
       console.error('Error creating note:', err);
       throw err;
     } finally {
       setLoading(false);
     }
-  }, [token, API_URL]);
+  }, [token, API_URL]);

   const updateNote = useCallback(async (noteId, noteData) => {
     if (!token) return;

     setLoading(true);
     setError(null);

     try {
       const response = await axios.put(`${API_URL}/api/notes/${noteId}`, noteData, {
         headers: { Authorization: `Bearer ${token}` }
       });
       
       const updatedNote = response.data;
       setNotes(prev => prev.map(note => 
         note.id === noteId ? updatedNote : note
       ));
       
       if (currentNote?.id === noteId) {
         setCurrentNote(updatedNote);
       }
       
       return updatedNote;
     } catch (err) {
       setError(err.response?.data?.detail || 'Ошибка обновления заметки');
       console.error('Error updating note:', err);
       throw err;
     } finally {
       setLoading(false);
     }
-  }, [token, currentNote, API_URL]);
+  }, [token, currentNote, API_URL]);

   const deleteNote = useCallback(async (noteId) => {
     if (!token) return;

     setLoading(true);
     setError(null);

     try {
       await axios.delete(`${API_URL}/api/notes/${noteId}`, {
         headers: { Authorization: `Bearer ${token}` }
       });
       
       setNotes(prev => prev.filter(note => note.id !== noteId));
       
       if (currentNote?.id === noteId) {
         setCurrentNote(null);
       }
       
       return true;
     } catch (err) {
       setError(err.response?.data?.detail || 'Ошибка удаления заметки');
       console.error('Error deleting note:', err);
       throw err;
     } finally {
       setLoading(false);
     }
-  }, [token, currentNote, API_URL]);
+  }, [token, currentNote, API_URL]);

   const searchNotes = useCallback(async (query) => {
     if (!token || !query) return [];

     try {
       const response = await axios.get(`${API_URL}/api/notes`, {
         headers: { Authorization: `Bearer ${token}` },
         params: { search: query }
       });
       
       return response.data.filter(note => 
         note.title.toLowerCase().includes(query.toLowerCase()) ||
         note.text_content?.toLowerCase().includes(query.toLowerCase())
       );
     } catch (err) {
       console.error('Error searching notes:', err);
       return [];
     }
-  }, [token, API_URL]);
+  }, [token, API_URL]);