import React, { createContext, useState, useContext, useCallback } from 'react';
import axios from 'axios';

const BluetoothContext = createContext();

export const useBluetooth = () => {
  const context = useContext(BluetoothContext);
  if (!context) {
    throw new Error('useBluetooth must be used within a BluetoothProvider');
  }
  return context;
};

export const BluetoothProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [device, setDevice] = useState(null);
  const [characteristic, setCharacteristic] = useState(null);
  const [strokeData, setStrokeData] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  // Neo Smartpen dimo service UUIDs (these are typical for Neo devices)
  const NEO_SERVICE_UUID = '4f99f138-9e53-5750-9d4f-21896461b5c9';
  const NEO_CHARACTERISTIC_UUID = '4f99f139-9e53-5750-9d4f-21896461b5c9';

  const connectToDevice = useCallback(async () => {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth API не поддерживается в этом браузере');
    }

    setIsConnecting(true);
    setConnectionStatus('connecting');

    try {
      // Request device
      const bluetoothDevice = await navigator.bluetooth.requestDevice({
        filters: [{
          namePrefix: 'Neo'
        }, {
          namePrefix: 'dimo'
        }],
        optionalServices: [NEO_SERVICE_UUID]
      });

      setDevice(bluetoothDevice);

      // Connect to GATT server
      const server = await bluetoothDevice.gatt.connect();
      
      // Get service
      const service = await server.getPrimaryService(NEO_SERVICE_UUID);
      
      // Get characteristic
      const char = await service.getCharacteristic(NEO_CHARACTERISTIC_UUID);
      
      setCharacteristic(char);

      // Start notifications
      await char.startNotifications();
      
      // Add event listener for notifications
      char.addEventListener('characteristicvaluechanged', handleNotification);

      // Add disconnect listener
      bluetoothDevice.addEventListener('gattserverdisconnected', handleDisconnect);

      setIsConnected(true);
      setConnectionStatus('connected');
      
      return { success: true };
      
    } catch (error) {
      console.error('Bluetooth connection failed:', error);
      setConnectionStatus('disconnected');
      return { 
        success: false, 
        error: error.message || 'Не удалось подключиться к устройству' 
      };
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const handleNotification = useCallback((event) => {
    const value = event.target.value;
    const data = parseStrokeData(value);
    
    if (data) {
      setStrokeData(prev => [...prev, data]);
    }
  }, []);

  const parseStrokeData = (dataView) => {
    try {
      // Parse the data according to Neo Smartpen protocol
      // This is a simplified version - actual implementation would need
      // proper protocol parsing
      const x = dataView.getUint16(0, true);
      const y = dataView.getUint16(2, true);
      const pressure = dataView.getUint8(4);
      const timestamp = Date.now();

      return {
        x,
        y,
        pressure,
        timestamp
      };
    } catch (error) {
      console.error('Error parsing stroke data:', error);
      return null;
    }
  };

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setDevice(null);
    setCharacteristic(null);
    console.log('Device disconnected');
  }, []);

  const disconnect = useCallback(async () => {
    if (device && device.gatt.connected) {
      await device.gatt.disconnect();
    }
    handleDisconnect();
  }, [device, handleDisconnect]);

  const sendStrokeData = useCallback(async () => {
    if (strokeData.length === 0) return;

    try {
      const response = await axios.post(`${API_URL}/api/bluetooth/connect`, {
        device_id: device?.id || 'unknown',
        stroke_data: strokeData,
        timestamp: new Date().toISOString()
      });

      // Clear stroke data after sending
      setStrokeData([]);
      
      return response.data;
    } catch (error) {
      console.error('Failed to send stroke data:', error);
      throw error;
    }
  }, [strokeData, device, API_URL]);

  const clearStrokeData = useCallback(() => {
    setStrokeData([]);
  }, []);

  const value = {
    isConnected,
    device,
    strokeData,
    isConnecting,
    connectionStatus,
    connectToDevice,
    disconnect,
    sendStrokeData,
    clearStrokeData
  };

  return (
    <BluetoothContext.Provider value={value}>
      {children}
    </BluetoothContext.Provider>
  );
};