import sinon from 'sinon';
import BackupController from './backup';

function getMockPreferencesController() {
  const mcState = {
    getSelectedAddress: sinon.stub().returns('0x01'),
    selectedAddress: '0x01',
    identities: {
      '0x295e26495CEF6F69dFA69911d9D8e4F3bBadB89B': {
        address: '0x295e26495CEF6F69dFA69911d9D8e4F3bBadB89B',
        lastSelected: 1655380342907,
        name: 'Account 3',
      },
    },
    lostIdentities: {
      '0xfd59bbe569376e3d3e4430297c3c69ea93f77435': {
        address: '0xfd59bbe569376e3d3e4430297c3c69ea93f77435',
        lastSelected: 1655379648197,
        name: 'Ledger 1',
      },
    },
    update: (store) => (mcState.store = store),
  };

  mcState.store = {
    getState: sinon.stub().returns(mcState),
    updateState: (store) => (mcState.store = store),
  };

  return mcState;
}

function getMockAddressBookController() {
  const mcState = {
    addressBook: {
      '0x61': {
        '0x42EB768f2244C8811C63729A21A3569731535f06': {
          address: '0x42EB768f2244C8811C63729A21A3569731535f06',
          chainId: '0x61',
          isEns: false,
          memo: '',
          name: '',
        },
      },
    },

    update: (store) => (mcState.store = store),
  };

  mcState.store = {
    getState: sinon.stub().returns(mcState),
    updateState: (store) => (mcState.store = store),
  };

  return mcState;
}

function getMockNetworkController() {
  const mcState = {
    networkConfigurations: {},

    update: (store) => (mcState.store = store),
  };

  mcState.store = {
    getState: sinon.stub().returns(mcState),
    updateState: (store) => (mcState.store = store),
  };

  return mcState;
}

const jsonData = JSON.stringify({
  addressBook: {
    addressBook: {
      '0x61': {
        '0x42EB768f2244C8811C63729A21A3569731535f06': {
          address: '0x42EB768f2244C8811C63729A21A3569731535f06',
          chainId: '0x61',
          isEns: false,
          memo: '',
          name: '',
        },
      },
    },
  },
  network: {
    networkConfigurations: {
      'network-configuration-id-1': {
        chainId: '0x539',
        nickname: 'Localhost 8545',
        rpcPrefs: {},
        rpcUrl: 'http://localhost:8545',
        ticker: 'ETH',
      },
      'network-configuration-id-2': {
        chainId: '0x38',
        nickname: 'Binance Smart Chain Mainnet',
        rpcPrefs: {
          blockExplorerUrl: 'https://bscscan.com',
        },
        rpcUrl: 'https://bsc-dataseed1.binance.org',
        ticker: 'BNB',
      },
      'network-configuration-id-3': {
        chainId: '0x61',
        nickname: 'Binance Smart Chain Testnet',
        rpcPrefs: {
          blockExplorerUrl: 'https://testnet.bscscan.com',
        },
        rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
        ticker: 'tBNB',
      },
      'network-configuration-id-4': {
        chainId: '0x89',
        nickname: 'Polygon Mainnet',
        rpcPrefs: {
          blockExplorerUrl: 'https://polygonscan.com',
        },
        rpcUrl: 'https://polygon-rpc.com',
        ticker: 'MATIC',
      },
    },
  },
  preferences: {
    useBlockie: false,
    useNonceField: false,
    usePhishDetect: true,
    dismissSeedBackUpReminder: false,
    useTokenDetection: false,
    useCollectibleDetection: false,
    openSeaEnabled: false,
    advancedGasFee: null,
    featureFlags: {
      sendHexData: true,
      showIncomingTransactions: true,
    },
    knownMethodData: {},
    currentLocale: 'en',
    forgottenPassword: false,
    preferences: {
      hideZeroBalanceTokens: false,
      showFiatInTestnets: false,
      showTestNetworks: true,
      useNativeCurrencyAsPrimaryCurrency: true,
    },
    ipfsGateway: 'dweb.link',
    infuraBlocked: false,
    ledgerTransportType: 'webhid',
    theme: 'light',
    customNetworkListEnabled: false,
    textDirection: 'auto',
  },
});

describe('BackupController', () => {
  const getBackupController = () => {
    return new BackupController({
      preferencesController: getMockPreferencesController(),
      addressBookController: getMockAddressBookController(),
      networkController: getMockNetworkController(),
      trackMetaMetricsEvent: sinon.stub(),
    });
  };

  describe('constructor', () => {
    it('should setup correctly', async () => {
      const backupController = getBackupController();
      const selectedAddress =
        backupController.preferencesController.getSelectedAddress();
      expect(selectedAddress).toStrictEqual('0x01');
    });

    it('should restore backup', async () => {
      const backupController = getBackupController();
      backupController.restoreUserData(jsonData);
      // check networks backup
      expect(
        backupController.networkController.store.networkConfigurations[
          'network-configuration-id-1'
        ].chainId,
      ).toStrictEqual('0x539');
      expect(
        backupController.networkController.store.networkConfigurations[
          'network-configuration-id-2'
        ].chainId,
      ).toStrictEqual('0x38');
      expect(
        backupController.networkController.store.networkConfigurations[
          'network-configuration-id-3'
        ].chainId,
      ).toStrictEqual('0x61');
      expect(
        backupController.networkController.store.networkConfigurations[
          'network-configuration-id-4'
        ].chainId,
      ).toStrictEqual('0x89');
      // check Preferences backup
      expect(
        backupController.preferencesController.store.frequentRpcListDetail[0]
          .chainId,
      ).toStrictEqual('0x539');
      expect(
        backupController.preferencesController.store.frequentRpcListDetail[1]
          .chainId,
      ).toStrictEqual('0x38');
      // make sure identities are not lost after restore
      expect(
        backupController.preferencesController.store.identities[
          '0x295e26495CEF6F69dFA69911d9D8e4F3bBadB89B'
        ].lastSelected,
      ).toStrictEqual(1655380342907);
      expect(
        backupController.preferencesController.store.identities[
          '0x295e26495CEF6F69dFA69911d9D8e4F3bBadB89B'
        ].name,
      ).toStrictEqual('Account 3');
      expect(
        backupController.preferencesController.store.lostIdentities[
          '0xfd59bbe569376e3d3e4430297c3c69ea93f77435'
        ].lastSelected,
      ).toStrictEqual(1655379648197);
      expect(
        backupController.preferencesController.store.lostIdentities[
          '0xfd59bbe569376e3d3e4430297c3c69ea93f77435'
        ].name,
      ).toStrictEqual('Ledger 1');
      // make sure selected address is not lost after restore
      expect(
        backupController.preferencesController.store.selectedAddress,
      ).toStrictEqual('0x01');
      // check address book backup
      expect(
        backupController.addressBookController.store.addressBook['0x61'][
          '0x42EB768f2244C8811C63729A21A3569731535f06'
        ].chainId,
      ).toStrictEqual('0x61');
      expect(
        backupController.addressBookController.store.addressBook['0x61'][
          '0x42EB768f2244C8811C63729A21A3569731535f06'
        ].address,
      ).toStrictEqual('0x42EB768f2244C8811C63729A21A3569731535f06');
      expect(
        backupController.addressBookController.store.addressBook['0x61'][
          '0x42EB768f2244C8811C63729A21A3569731535f06'
        ].isEns,
      ).toStrictEqual(false);
    });
  });
});
