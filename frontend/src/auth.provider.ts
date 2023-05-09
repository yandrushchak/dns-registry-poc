import { AuthProvider } from 'react-admin';
import * as ethers from 'ethers';

export const ACCOUNT_STORAGE_KEY = 'account';

class AppAuthProvider implements AuthProvider {
  public async login() {
    const provider = new ethers.BrowserProvider(window.ethereum, import.meta.env.VITE_NETWORK);
    const accounts = await provider.send('eth_requestAccounts', []);
    localStorage.setItem(ACCOUNT_STORAGE_KEY, accounts[0]);
  }

  public async getAddress(): Promise<string> {
    await this.checkAuth();
    const account = localStorage.getItem(ACCOUNT_STORAGE_KEY)!;
    return account;
  }

  public async logout() {
    localStorage.removeItem(ACCOUNT_STORAGE_KEY);
  }

  public async checkAuth() {
    if (!localStorage.getItem(ACCOUNT_STORAGE_KEY)) {
      throw new Error('Unauthorized');
    }
  }

  public async checkError() {
    // noop for now
  }

  public async getIdentity() {
    const address = await this.getAddress();
    return {
      id: address,
      fullName: address,
    };
  }

  public async getPermissions() {
    return '';
  }
}

const authProvider = new AppAuthProvider();
export default authProvider;
