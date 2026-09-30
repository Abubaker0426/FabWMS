import { useCallback, useState } from 'react';
import Toast from 'react-native-toast-message';
import { postPalletDetails } from '../api/apiService';
import { ToastDefaults } from '../constants/toastConfig';

export const usePalletRobotic = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [scannedItems, setScannedItems] = useState([]);

  const notify = useCallback((type, text1, text2) => {
    Toast.show({ ...ToastDefaults, type, text1, text2 });
  }, []);

  const handleScannedData = useCallback(async (scanResult) => {
    const barcode = scanResult?.data?.trim();
    if (!barcode || isLoading) return;

    setIsLoading(true);
    try {
      const response = await postPalletDetails('1', barcode);
      setScannedItems(prev => [...prev, { id: Date.now(), barcode, response }]);
      notify('success', 'Confirmed', `Rack: ${barcode}`);
    } catch (error) {
      const msg =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'POST failed';
      notify('error', 'Failed', msg);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, notify]);

  const reset = useCallback(() => {
    setScannedItems([]);
    notify('info', 'Reset', 'All data cleared.');
  }, [notify]);

  return { isLoading, scannedItems, handleScannedData, reset };
};
