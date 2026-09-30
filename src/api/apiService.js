import axios from 'axios';
import authService from '../config/authConfig';
import { logger } from '../utils/logger';

// const ROBOTIC_BASE_URL = 'http://192.168.0.168:8000';
const ROBOTIC_BASE_URL = 'http://192.168.0.168:8000';
// http://192.168.0.168:8000

// ─── Locations ────────────────────────────────────────────────────────────────

export const fetchLocations = async () => {
  try {
    if (!authService) throw new Error('AuthService is not initialized');
    const response = await authService.request('GET', '/service/locations');
    logger.api('fetchLocations', response);
    return response;
  } catch (error) {
    logger.error('[API] fetchLocations:', error);
    throw error;
  }
};

// ─── Barcode details ──────────────────────────────────────────────────────────

export const fetchBarcodeDetails = async (barcode) => {
  try {
    const response = await authService.request('GET', `/fabwms/${barcode}`);
    logger.api('fetchBarcodeDetails', response);
    return response;
  } catch (error) {
    logger.error('[API] fetchBarcodeDetails:', error);
    throw error;
  }
};

// ─── Rack details ─────────────────────────────────────────────────────────────

export const fetchPalletRackDetails = async (rackBarcode) => {
  try {
    const response = await authService.request('GET', `/fabwms/racks/${rackBarcode}`);
    logger.api('fetchPalletRackDetails', response);
    return response;
  } catch (error) {
    logger.error('[API] fetchPalletRackDetails:', error);
    throw error;
  }
};

export const fetchRackFabricDetails = async (rackBarcode) => {
  try {
    const response = await authService.request('GET', `/fabwms/racks/${rackBarcode}/fabric`);
    logger.api('fetchRackFabricDetails', response);
    return response;
  } catch (error) {
    logger.error('[API] fetchRackFabricDetails:', error);
    throw error;
  }
};

// ─── Warehouse entry (POST) ───────────────────────────────────────────────────

export const postPalletData = async (palletBarcode, requestData) => {
  try {
    logger.api('postPalletData →', { palletBarcode, requestData });
    const response = await authService.request(
      'POST',
      `/fabwms/pallets/${palletBarcode}`,
      requestData,
      { headers: { 'Content-Type': 'application/json' } }
    );
    logger.api('postPalletData ←', response);
    return response;
  } catch (error) {
    logger.error('[API] postPalletData:', {
      message: error.message,
      status:  error.response?.status,
      data:    error.response?.data,
    });
    throw error;
  }
};

export const postFabricData = async (fabricBarcode) => {
  try {
    const response = await authService.request('POST', `/fabwms/fabric/${fabricBarcode}`);
    logger.api('postFabricData', response);
    return response;
  } catch (error) {
    logger.error('[API] postFabricData:', error);
    throw error;
  }
};

// ─── Rack entry (POST) ────────────────────────────────────────────────────────

export const postPalletToRack = async (rackBarcode, palletBarcode) => {
  try {
    const response = await authService.request(
      'POST',
      `/fabwms/racks/${rackBarcode}/pallets/${palletBarcode}`
    );
    logger.api('postPalletToRack', response);
    return response;
  } catch (error) {
    logger.error('[API] postPalletToRack:', error);
    throw error;
  }
};

export const postFabricToRack = async (rackBarcode, fabricBarcode) => {
  try {
    const response = await authService.request(
      'POST',
      `/fabwms/racks/${rackBarcode}/fabric/${fabricBarcode}`
    );
    logger.api('postFabricToRack', response);
    return response;
  } catch (error) {
    logger.error('[API] postFabricToRack:', error);
    throw error;
  }
};

// ─── Warehouse exit (PUT) ─────────────────────────────────────────────────────

export const putPalletContainer = async (containerNumber, palletBarcodes) => {
  const requestBody = {
    containerNumber,
    palletBarcodes: palletBarcodes.map(code => ({ palletBarcode: code })),
  };
  logger.api('putPalletContainer →', requestBody);

  try {
    const response = await authService.request(
      'PUT',
      `/fabwms/pallets/palletBarcode/containerNumber`,
      requestBody,
      { headers: { 'Content-Type': 'application/json' } }
    );
    logger.api('putPalletContainer ←', response);
    return response;
  } catch (error) {
    logger.error('[API] putPalletContainer:', error);
    throw error;
  }
};

export const putFabricData = async (fabricBarcode) => {
  try {
    const response = await authService.request('PUT', `/fabwms/fabric/${fabricBarcode}`);
    logger.api('putFabricData', response);
    return response;
  } catch (error) {
    logger.error('[API] putFabricData:', error);
    throw error;
  }
};

// ─── Rack exit (PUT) ──────────────────────────────────────────────────────────

export const putPalletFromRack = async (palletBarcode) => {
  try {
    const response = await authService.request('PUT', `/fabwms/racks/pallets/${palletBarcode}`);
    logger.api('putPalletFromRack', response);
    return response;
  } catch (error) {
    logger.error('[API] putPalletFromRack:', error);
    throw error;
  }
};

export const putFabricToRack = async (fabricBarcode) => {
  try {
    const response = await authService.request('PUT', `/fabwms/racks/fabric/${fabricBarcode}`);
    logger.api('putFabricToRack', response);
    return response;
  } catch (error) {
    logger.error('[API] putFabricToRack:', error);
    throw error;
  }
};



// ─── Pallet details robotic  (POST) ──────────────────────────────────────────────────────────



export const postPalletDetails = async (rackUid, rackBarcode) => {
  const body = [{ racks_unique_id: rackUid, barcode: rackBarcode }];
  console.log('[postPalletDetails] URL:', `${ROBOTIC_BASE_URL}/reload_confirmation`);
  console.log('[postPalletDetails] Body:', JSON.stringify(body));
  try {
    const response = await axios.post(
      `${ROBOTIC_BASE_URL}/reload_confirmation`,
      body,
      {
        headers: { 'Content-Type': 'application/json' },
        auth: { username: 'erp', password: 'erp123' },
      }
    );
    console.log('[postPalletDetails] Response:', JSON.stringify(response.data));
    logger.api('postPalletDetails', response.data);
    return response.data;
  } catch (error) {
    console.log('[postPalletDetails] Error status:', error?.response?.status);
    console.log('[postPalletDetails] Error data:', JSON.stringify(error?.response?.data));
    logger.error('[API] postPalletDetails:', error);
    throw error;
  }
};