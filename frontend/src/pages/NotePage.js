import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotes } from '../contexts/NotesContext';
import { useBluetooth } from '../contexts/BluetoothContext';
import DrawingCanvas from '../components/DrawingCanvas';
import Tesseract from 'tesseract.js';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

const NotePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notes, updateNote, loading } = useNotes();
  const { isConnected } = useBluetooth();
  
  const [note, setNote] = useState(null);
  const [title, setTitle] = useState('');
  const [canvasData, setCanvasData] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    const currentNote = notes.find(n => n.id === id);
    if (currentNote) {
      setNote(currentNote);
      setTitle(currentNote.title);
      setCanvasData(currentNote.content || '');
      setExtractedText(currentNote.text_content || '');
    }
  }, [id, notes]);

  const handleSave = async () => {
    if (!note) return;

    setIsSaving(true);
    try {
      await updateNote(note.id, {
        title,
        content: canvasData,
        text_content: extractedText
      });
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCanvasChange = (data) => {
    setCanvasData(data);
  };

  const extractTextFromCanvas = async () => {
    if (!canvasData) return;

    setIsExtracting(true);
    try {
      const { data: { text } } = await Tesseract.recognize(canvasData, 'rus+eng', {
        logger: m => console.log(m)
      });
      setExtractedText(text);
    } catch (error) {
      console.error('Error extracting text:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  const exportToPDF = async () => {
    if (!canvasData) return;

    const pdf = new jsPDF();
    const imgData = canvasData;
    
    // Add title
    pdf.setFontSize(16);
    pdf.text(title, 20, 20);
    
    // Add image
    pdf.addImage(imgData, 'PNG', 20, 30, 170, 120);
    
    // Add extracted text if available
    if (extractedText) {
      pdf.setFontSize(12);
      pdf.text('Распознанный текст:', 20, 160);
      const splitText = pdf.splitTextToSize(extractedText, 170);
      pdf.text(splitText, 20, 170);
    }
    
    pdf.save(`${title}.pdf`);
  };

  const exportToPNG = () => {
    if (!canvasData) return;

    const link = document.createElement('a');
    link.download = `${title}.png`;
    link.href = canvasData;
    link.click();
  };

  const syncToGoogleDrive = async () => {
    // This would integrate with Google Drive API
    // For now, we'll just show a placeholder
    alert('Синхронизация с Google Drive будет доступна в следующих версиях');
  };

  if (loading || !note) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl font-semibold text-gray-900 border-none bg-transparent focus:outline-none"
                placeholder="Название заметки"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Bluetooth Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Подключено' : 'Отключено'}
                </span>
              </div>
              
              {/* Export Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                    <div className="py-1">
                      <button
                        onClick={exportToPDF}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        📄 Экспорт в PDF
                      </button>
                      <button
                        onClick={exportToPNG}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        🖼️ Экспорт в PNG
                      </button>
                      <button
                        onClick={syncToGoogleDrive}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        📁 Синхронизация с Google Drive
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary"
              >
                {isSaving ? (
                  <div className="spinner w-4 h-4"></div>
                ) : (
                  'Сохранить'
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Drawing Canvas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Холст для рисования
                </h2>
                <button
                  onClick={extractTextFromCanvas}
                  disabled={isExtracting || !canvasData}
                  className="btn-secondary text-sm"
                >
                  {isExtracting ? (
                    <>
                      <div className="spinner w-4 h-4 mr-2"></div>
                      Обработка...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Распознать текст
                    </>
                  )}
                </button>
              </div>
              
              <div className="h-96 lg:h-[500px]">
                <DrawingCanvas
                  onCanvasChange={handleCanvasChange}
                  initialData={canvasData}
                />
              </div>
            </div>
          </div>

          {/* Text Recognition Panel */}
          <div className="space-y-6">
            {/* Extracted Text */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Распознанный текст
              </h3>
              
              <textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                placeholder="Здесь появится распознанный текст..."
                className="w-full h-40 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              
              {extractedText && (
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Символов: {extractedText.length}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(extractedText);
                      alert('Текст скопирован в буфер обмена');
                    }}
                    className="btn-outline text-sm"
                  >
                    Копировать
                  </button>
                </div>
              )}
            </div>

            {/* Note Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Информация о заметке
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Создано:</span>
                  <span className="text-gray-900">
                    {new Date(note.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Изменено:</span>
                  <span className="text-gray-900">
                    {new Date(note.updated_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Статус:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    note.google_drive_id 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {note.google_drive_id ? 'Синхронизировано' : 'Локально'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotePage;