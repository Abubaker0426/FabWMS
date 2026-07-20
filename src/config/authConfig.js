import { API_BASE_URL, AUTH0_AUDIENCE, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_TOKEN_ENDPOINT, AUTH0_USER_LOGIN_ENDPOINT } from '@env';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { logger } from '../utils/logger';

export const AUTH_CONFIG = {
    baseURL: API_BASE_URL,
    auth: {
        clientId: AUTH0_CLIENT_ID,
        clientSecret: AUTH0_CLIENT_SECRET,
        audience: AUTH0_AUDIENCE,
        tokenEndpoint: AUTH0_TOKEN_ENDPOINT,
        userLoginEndpoint: AUTH0_USER_LOGIN_ENDPOINT
    }

};


class AuthService {
    static instance = new AuthService();
    token = null;
    tokenExpiry = null;
    tokenRequest = null;

    constructor() { this.logConfig(); }
    logConfig() {
        console.log('=== Environment Variables ===');
        console.log('API_BASE_URL:', API_BASE_URL);
        console.log('AUTH0_CLIENT_ID:', AUTH0_CLIENT_ID ? '✓ Set' : '✗ Missing');
        console.log('AUTH0_CLIENT_SECRET:', AUTH0_CLIENT_SECRET? '✓ Set' : '✗ Missing');
        console.log('AUTH0_TOKEN_ENDPOINT:', AUTH0_TOKEN_ENDPOINT);
        console.log('AUTH0_USER_LOGIN_ENDPOINT:', AUTH0_USER_LOGIN_ENDPOINT);
        console.log('===========================');
    }

    static getInstance() {
        return this.instance;
    }

    async userLogin(username, password) {
        try {
            const { data } = await axios.post(AUTH_CONFIG.auth.userLoginEndpoint, {
                grant_type: 'password',
                username: username,
                password: password,
                client_id: AUTH_CONFIG.auth.clientId,
                client_secret: AUTH_CONFIG.auth.clientSecret,
                audience: AUTH_CONFIG.auth.audience
            });

            if (!data.access_token) {
                throw new Error('Login failed - no token received');
            }

            await this._storeAuthData(data);

            return data.access_token;
        } catch (error) {
            logger.error('[Auth] Login failed:', error);
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    }

    async _storeAuthData(authData) {
        await SecureStore.setItemAsync('authToken', authData.access_token);
        await SecureStore.setItemAsync('tokenExpiry',
            (Date.now() + (authData.expires_in - 300) * 1000).toString());
    }

    async isAuthenticated() {
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const expiry = await SecureStore.getItemAsync('tokenExpiry');
            logger.log('[Auth] Token exists:', !!token, 'Valid:', expiry && parseInt(expiry) > Date.now());
            return token && expiry && parseInt(expiry) > Date.now();
        } catch (error) {
            logger.error('[Auth] Auth check error:', error);
            return false;
        }
    }

    async getNewToken() {
        try {
            const { data } = await axios.post(AUTH_CONFIG.auth.tokenEndpoint, {
                client_id: AUTH_CONFIG.auth.clientId,
                client_secret: AUTH_CONFIG.auth.clientSecret,
                audience: AUTH_CONFIG.auth.audience,
                grant_type: 'client_credentials'
            });

            if (!data.access_token) {
                throw new Error('No access token received');
            }

            this.token = data.access_token;
            this.tokenExpiry = new Date(Date.now() + (data.expires_in - 300) * 1000);
            return data.access_token;
        } catch (error) {
            logger.error('[Auth] Token fetch failed:', error);
            throw new Error('Authentication failed');
        }
    }

    async getToken() {
        if (this.tokenRequest) {
            return this.tokenRequest;
        }

        if (this.token && this.tokenExpiry && this.tokenExpiry > new Date()) {
            return this.token;
        }

        this.tokenRequest = this.getNewToken();
        try {
            const token = await this.tokenRequest;
            return token;
        } finally {
            this.tokenRequest = null;
        }
    }

    getAuthHeaders = async () => {
        const token = await this.getToken();
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Version': '8.0'
        };
    };

    setUserToken(token) {
        if (token) {
            this.token = token;
            this.tokenExpiry = new Date(Date.now() + 86400 * 1000); // treat as 24h valid
        } else {
            this.token = null;
            this.tokenExpiry = null;
        }
    }

    async request(method, endpoint, body) {
        const makeRequest = async (token) => {
            const response = await axios({
                method,
                url: `${AUTH_CONFIG.baseURL}${endpoint}`,
                data: body,
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    Version: '8.0'
                }
            });
            return response.data;
        };

        try {
            const token = await this.getToken();
            const data = await makeRequest(token);
            return data;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                this.token = null;
                this.tokenExpiry = null;
                try {
                    const newToken = await this.getToken();
                    const data = await makeRequest(newToken);
                    return data;
                } catch (retryError) {
                    logger.error('[Auth] Authentication failed:', retryError.message);
                    throw retryError;
                }
            }
            logger.error('[Auth] Request failed:', error.message);
            throw error;
        }
    }
}

export default AuthService.getInstance();