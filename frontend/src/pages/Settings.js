import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBluetooth } from '../contexts/BluetoothContext';

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isConnected, device, disconnect } = useBluetooth();
  
  const [settings, setSettings] = useState({
    autoSave: true,
    ocrLanguage: 'rus+eng',
    syncToGoogleDrive: false,
    strokeThickness: 2,
    canvasBackground: '#ffffff'
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDisconnectDevice = async () => {
    await disconnect();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
              
              <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Device Settings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Устройство
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Bluetooth устройство
                  </h3>
                  <p className="text-sm text-gray-500">
                    {isConnected && device 
                      ? `Подключено: ${device.name || 'Neo Smartpen'}`
                      : 'Устройство не подключено'
                    }
                  </p>
                </div>
                
                {isConnected && (
                  <button
                    onClick={handleDisconnectDevice}
                    className="btn-secondary"
                  >
                    Отключить
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Автосохранение
                  </h3>
                  <p className="text-sm text-gray-500">
                    Автоматически сохранять изменения
                  </p>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.autoSave}
                    onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Canvas Settings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Холст
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Толщина линии
                  </h3>
                  <p className="text-sm text-gray-500">
                    Толщина линии для рисования
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">{settings.strokeThickness}px</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={settings.strokeThickness}
                    onChange={(e) => handleSettingChange('strokeThickness', parseInt(e.target.value))}
                    className="w-24"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Цвет фона
                  </h3>
                  <p className="text-sm text-gray-500">
                    Цвет фона холста
                  </p>
                </div>
                
                <input
                  type="color"
                  value={settings.canvasBackground}
                  onChange={(e) => handleSettingChange('canvasBackground', e.target.value)}
                  className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* OCR Settings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Распознавание текста
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Языки для распознавания
                  </h3>
                  <p className="text-sm text-gray-500">
                    Выберите языки для OCR
                  </p>
                </div>
                
                <select
                  value={settings.ocrLanguage}
                  onChange={(e) => handleSettingChange('ocrLanguage', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="rus">Русский</option>
                  <option value="eng">Английский</option>
                  <option value="rus+eng">Русский + Английский</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sync Settings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Синхронизация
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Google Drive
                  </h3>
                  <p className="text-sm text-gray-500">
                    Автоматически синхронизировать с Google Drive
                  </p>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.syncToGoogleDrive}
                    onChange={(e) => handleSettingChange('syncToGoogleDrive', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
              {settings.syncToGoogleDrive && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-600">
                    🔗 Подключите Google Drive для синхронизации заметок
                  </p>
                  <button className="mt-2 btn-outline text-sm">
                    Подключить Google Drive
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Account Settings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Аккаунт
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Пользователь
                  </h3>
                  <p className="text-sm text-gray-500">
                    {user?.username || 'Не авторизован'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Выйти из аккаунта
                </button>
              </div>
            </div>
          </div>

          {/* App Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              О приложении
            </h2>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Версия:</strong> 1.0.0</p>
              <p><strong>Совместимость:</strong> Neo Smartpen dimo</p>
              <p><strong>Поддерживаемые форматы:</strong> PDF, PNG</p>
              <p><strong>Разработчик:</strong> Smart Pen Team</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;