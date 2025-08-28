// Block MetaMask and other crypto wallets from interfering with the travel agency app

const blockCryptoWallets = () => {
  try {
    // Override ethereum object
    if (window.ethereum) {
      console.warn('🛡️ Travel Agency: Blocking crypto wallet access');
      delete window.ethereum;
    }

    // Override web3 object  
    if (window.web3) {
      delete window.web3;
    }

    // Prevent MetaMask detection
    window.isMetaMask = false;

    // Block common wallet providers
    const walletProviders = ['ethereum', 'web3', 'BinanceChain', 'trustWallet'];
    walletProviders.forEach(provider => {
      if (window[provider]) {
        delete window[provider];
      }
    });

  } catch (error) {
    console.warn('Travel Agency: Error blocking crypto wallets:', error);
  }
};

// Block immediately
blockCryptoWallets();

// Block continuously to prevent injection
setInterval(blockCryptoWallets, 500);

export default blockCryptoWallets;