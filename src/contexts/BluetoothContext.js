@@ .. @@
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
-  }, []);
+  }, [handleDisconnect]);

   const handleDisconnect = useCallback(() => {
     setIsConnected(false);
     setConnectionStatus('disconnected');
     setDevice(null);
     setCharacteristic(null);
     console.log('Device disconnected');
-  }, []);
+  }, []);

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
-  }, [strokeData, device, API_URL]);
+  }, [strokeData, device, API_URL]);