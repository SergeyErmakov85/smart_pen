import React, { useState } from 'react';
import { useBluetooth } from '../contexts/BluetoothContext';

const BluetoothConnection = () => {
  const { 
    isConnected, 
    device, 
    isConnecting, 
    connectionStatus, 
    connectToDevice, 
    disconnect 
  } = useBluetooth();
  
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    setError(null);
    const result = await connectToDevice();
    if (!result.success) {
      setError(result.error);
    }
  };

  const handleDisconnect = async () => {
    setError(null);
    await disconnect();
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600';
      case 'connecting':
        return 'text-yellow-600';
      case 'disconnected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Подключено';
      case 'connecting':
        return 'Подключение...';
      case 'disconnected':
        return 'Отключено';
      default:
        return 'Неизвестно';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Bluetooth подключение</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      {device && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Устройство:</strong> {device.name || 'Неизвестное устройство'}
          </p>
          <p className="text-sm text-gray-600">
            <strong>ID:</strong> {device.id}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex space-x-4">
        {!isConnected ? (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="btn-primary flex items-center space-x-2"
          >
            {isConnecting ? (
              <>
                <div className="spinner w-4 h-4"></div>
                <span>Подключение...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.5C15.5 15 20.5 10 20.5 6.5C20.5 3.5 18 1 15 1C13.4 1 12.1 1.6 11.2 2.6C10.3 1.6 9 1 7.5 1C4.5 1 2 3.5 2 6.5C2 10 7 15 10.5 18.5L12 20L12 18.5Z" />
                </svg>
                <span>Подключить Neo Smartpen</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleDisconnect}
            className="btn-secondary flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Отключить</span>
          </button>
        )}
      </div>

      {!navigator.bluetooth && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-600">
            ⚠️ Web Bluetooth API не поддерживается в этом браузере. 
            Используйте Chrome для Android для подключения к умной ручке.
          </p>
        </div>
      )}
    </div>
  );
};

export default BluetoothConnection;