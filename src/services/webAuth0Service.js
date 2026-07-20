import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

const AUTH0_DOMAIN    = 'dev-q9u-izlr.auth0.com';
const AUTH0_CLIENT_ID = 'E1IyVTsEqMu5b75JKNKWwbDEr7w0dgsR';
const AUTH0_AUDIENCE  = 'https://api.fabtrakr.com';
const AUTH0_SCOPE     = 'openid profile email offline_access read:current_user update:current_user_metadata';

const PRODUCTION_REDIRECT = `xyza://${AUTH0_DOMAIN}/android/com.fabwms/callback`;

// In Expo Go __DEV__ is true and the bundle runs on exp:// — use makeRedirectUri
// In a real APK __DEV__ may still be true for debug builds, so check the scheme instead
const getRedirectUri = () => {
  // expo-constants is not needed — just check if we're in Expo Go via the global
  if (typeof expo !== 'undefined' && expo?.modules?.ExpoGo) {
    // Running inside Expo Go
    return `exp://192.168.5.58:8081/--/android/com.fabwms/callback`;
  }
  return PRODUCTION_REDIRECT;
};

class WebAuth0Service {
  static instance = null;
  static getInstance() {
    if (!this.instance) this.instance = new WebAuth0Service();
    return this.instance;
  }

  constructor() {
    this.redirectUri = PRODUCTION_REDIRECT;
    console.log('Auth0 redirect URI:', this.redirectUri);
  }

  async login() {
    const authUrl =
      `https://${AUTH0_DOMAIN}/authorize?` +
      `client_id=${AUTH0_CLIENT_ID}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent(AUTH0_SCOPE)}&` +
      `audience=${encodeURIComponent(AUTH0_AUDIENCE)}&` +
      `redirect_uri=${encodeURIComponent(this.redirectUri)}`;

    console.log('Opening Auth0 URL:', authUrl);
    const result = await WebBrowser.openAuthSessionAsync(authUrl, this.redirectUri);
    console.log('WebBrowser result type:', result.type);

    if (result.type === 'success' && result.url) {
      const match = result.url.match(/access_token=([^&]+)/);
      const token = match?.[1] ? decodeURIComponent(match[1]) : null;
      if (!token) throw new Error('No access token found in callback URL');
      const credentials = { access_token: token, token_type: 'Bearer' };
      await this.saveCredentials(credentials);
      return credentials;
    }
    throw new Error(`Login was cancelled or failed: ${result.type}`);
  }

  async getUserProfile(accessToken) {
    const response = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const body = await response.text();
      console.log('userinfo error body:', body);
      throw new Error(`Failed to get user info: ${response.status}`);
    }
    return response.json();
  }

  async saveCredentials(tokens) {
    await AsyncStorage.setItem('auth0_credentials', JSON.stringify(tokens));
  }

  async getStoredCredentials() {
    try {
      const stored = await AsyncStorage.getItem('auth0_credentials');
      if (!stored) return null;
      const credentials = JSON.parse(stored);
      return credentials?.access_token ? credentials : null;
    } catch {
      return null;
    }
  }

  async clearStoredCredentials() {
    await AsyncStorage.removeItem('auth0_credentials');
  }

  async logout() {
    await this.clearStoredCredentials();
    const logoutUrl =
      `https://${AUTH0_DOMAIN}/v2/logout?` +
      `client_id=${AUTH0_CLIENT_ID}&` +
      `returnTo=${encodeURIComponent(this.redirectUri)}`;
    await WebBrowser.openBrowserAsync(logoutUrl);
  }
}

export default WebAuth0Service.getInstance();
