import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import { getTokenTrackerLink } from '@metamask/etherscan-link/dist/token-tracker-link';
import Popover from '../../ui/popover/popover.component';
import { Tab, Tabs } from '../../ui/tabs';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getCurrentChainId,
  getIsDynamicTokenListAvailable,
  getIsMainnet,
  getIsTokenDetectionInactiveOnMainnet,
  getIsTokenDetectionSupported,
  getIstokenDetectionInactiveOnNonMainnetSupportedNetwork,
  getMetaMaskIdentities,
  getRpcPrefsForCurrentProvider,
  getSelectedAddress,
  getTokenDetectionSupportNetworkByChainId,
  getTokenList,
} from '../../../selectors';
import {
  addTokens,
  clearPendingTokens,
  getTokenStandardAndDetails,
  setPendingTokens,
} from '../../../store/actions';
import {
  BannerAlert,
  ButtonLink,
  ButtonPrimary,
  Text,
  FormTextField,
  ButtonSecondary,
} from '../../component-library';
import TokenSearch from '../../../pages/import-token/token-search';
import TokenList from '../../../pages/import-token/token-list/token-list.component';

import Box from '../../ui/box/box';
import {
  AlignItems,
  Display,
  FontWeight,
  Severity,
  TextVariant,
} from '../../../helpers/constants/design-system';

import {
  ADD_NFT_ROUTE,
  ASSET_ROUTE,
  SECURITY_ROUTE,
} from '../../../helpers/constants/routes';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { isValidHexAddress } from '../../../../shared/modules/hexstring-utils';
import { addHexPrefix } from '../../../../app/scripts/lib/util';
import { STATIC_MAINNET_TOKEN_LIST } from '../../../../shared/constants/tokens';
import {
  AssetType,
  TokenStandard,
} from '../../../../shared/constants/transaction';
import {
  checkExistingAddresses,
  getURLHostName,
} from '../../../helpers/utils/util';
import { tokenInfoGetter } from '../../../helpers/utils/token-util';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getPendingTokens } from '../../../ducks/metamask/metamask';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsTokenEventSource,
} from '../../../../shared/constants/metametrics';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import Identicon from '../../ui/identicon/identicon.component';
import TokenBalance from '../../ui/token-balance/token-balance';

export const ImportTokensPopover = ({ onClose }) => {
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();

  const [mode, setMode] = useState('');

  const [tokenSelectorError, setTokenSelectorError] = useState(null);
  const [selectedTokens, setSelectedTokens] = useState({});
  const [searchResults, setSearchResults] = useState([]);

  // Determine if we should show the search tab
  const isTokenDetectionSupported = useSelector(getIsTokenDetectionSupported);
  const isTokenDetectionInactiveOnMainnet = useSelector(
    getIsTokenDetectionInactiveOnMainnet,
  );
  const showSearchTab =
    isTokenDetectionSupported ||
    isTokenDetectionInactiveOnMainnet ||
    Boolean(process.env.IN_TEST);

  const tokenList = useSelector(getTokenList);
  const useTokenDetection = useSelector(
    ({ metamask }) => metamask.useTokenDetection,
  );
  const networkName = useSelector(getTokenDetectionSupportNetworkByChainId);

  // Custom token stuff
  const tokenDetectionInactiveOnNonMainnetSupportedNetwork = useSelector(
    getIstokenDetectionInactiveOnNonMainnetSupportedNetwork,
  );
  const isDynamicTokenListAvailable = useSelector(
    getIsDynamicTokenListAvailable,
  );
  const selectedAddress = useSelector(getSelectedAddress);
  const isMainnet = useSelector(getIsMainnet);
  const identities = useSelector(getMetaMaskIdentities);
  const tokens = useSelector((state) => state.metamask.tokens);
  const pendingTokens = useSelector((state) => state.metamask.pendingTokens);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);

  const [customAddress, setCustomAddress] = useState('');
  const [customAddressError, setCustomAddressError] = useState(null);
  const [nftAddressError, setNftAddressError] = useState(null);
  const [symbolAutoFilled, setSymbolAutoFilled] = useState(false);
  const [decimalAutoFilled, setDecimalAutoFilled] = useState(false);
  const [mainnetTokenWarning, setMainnetTokenWarning] = useState(null);
  const [customSymbol, setCustomSymbol] = useState('');
  const [customSymbolError, setCustomSymbolError] = useState(null);
  const [customDecimals, setCustomDecimals] = useState(0);
  const [customDecimalsError, setCustomDecimalsError] = useState(null);
  const [tokenStandard, setTokenStandard] = useState(TokenStandard.none);
  const [forceEditSymbol, setForceEditSymbol] = useState(false);

  const chainId = useSelector(getCurrentChainId);
  const blockExplorerTokenLink = getTokenTrackerLink(
    customAddress,
    chainId,
    null,
    null,
    { blockExplorerUrl: rpcPrefs?.blockExplorerUrl ?? null },
  );
  const blockExplorerLabel = rpcPrefs?.blockExplorerUrl
    ? getURLHostName(blockExplorerTokenLink)
    : t('etherscan');

  // Min and Max decimal values
  const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';
  const MIN_DECIMAL_VALUE = 0;
  const MAX_DECIMAL_VALUE = 36;

  const infoGetter = useRef(tokenInfoGetter());

  // CONFIRMATION MODE
  const trackEvent = useContext(MetaMetricsContext);
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const pendingTokenz = useSelector(getPendingTokens);
  const getTokenName = (name, symbol) => {
    return name === undefined ? symbol : `${name} (${symbol})`;
  };
  const handleAddTokens = useCallback(async () => {
    await dispatch(addTokens(pendingTokens));

    const addedTokenValues = Object.values(pendingTokenz);
    const firstTokenAddress = addedTokenValues?.[0].address?.toLowerCase();

    addedTokenValues.forEach((pendingToken) => {
      trackEvent({
        event: MetaMetricsEventName.TokenAdded,
        category: MetaMetricsEventCategory.Wallet,
        sensitiveProperties: {
          token_symbol: pendingToken.symbol,
          token_contract_address: pendingToken.address,
          token_decimal_precision: pendingToken.decimals,
          unlisted: pendingToken.unlisted,
          source_connection_method: pendingToken.isCustom
            ? MetaMetricsTokenEventSource.Custom
            : MetaMetricsTokenEventSource.List,
          token_standard: TokenStandard.ERC20,
          asset_type: AssetType.token,
        },
      });
    });

    dispatch(clearPendingTokens());

    if (firstTokenAddress) {
      history.push(`${ASSET_ROUTE}/${firstTokenAddress}`);
    } else {
      history.push(mostRecentOverviewPage);
    }
  }, [dispatch, history, mostRecentOverviewPage, pendingTokens, trackEvent]);

  useEffect(() => {
    if (Object.keys(pendingTokens).length === 0) {
      history.push(mostRecentOverviewPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const pendingTokenKeys = Object.keys(pendingTokens);

    if (pendingTokenKeys.length === 0) {
      return;
    }

    let initialSelectedTokens = {};
    let initialCustomToken = {};

    pendingTokenKeys.forEach((tokenAddress) => {
      const token = pendingTokens[tokenAddress];
      const { isCustom } = token;

      if (isCustom) {
        initialCustomToken = { ...token };
      } else {
        initialSelectedTokens = {
          selectedTokens: initialSelectedTokens,
          [tokenAddress]: { ...token },
        };
      }
    });

    setSelectedTokens(initialSelectedTokens);
    setCustomAddress(initialCustomToken.address);
    setCustomSymbol(initialCustomToken.symbol);
    setCustomDecimals(initialCustomToken.decimals);
  }, []);

  const handleCustomSymbolChange = (value) => {
    const symbol = value.trim();
    const symbolLength = customSymbol.length;
    let symbolError = null;

    if (symbolLength <= 0 || symbolLength >= 12) {
      symbolError = t('symbolBetweenZeroTwelve');
    }

    setCustomSymbol(symbol);
    setCustomSymbolError(symbolError);
  };

  const handleCustomDecimalsChange = (value) => {
    let decimals;
    let decimalsError = null;

    if (value) {
      decimals = Number(value.trim());
      decimalsError =
        value < MIN_DECIMAL_VALUE || value > MAX_DECIMAL_VALUE
          ? t('decimalsMustZerotoTen')
          : null;
    } else {
      decimals = '';
      decimalsError = t('tokenDecimalFetchFailed');
    }

    setCustomDecimals(decimals);
    setCustomDecimalsError(decimalsError);
  };

  const attemptToAutoFillTokenParams = async (address) => {
    const { symbol = '', decimals } = await infoGetter.current(
      address,
      tokenList,
    );

    setSymbolAutoFilled(Boolean(symbol));
    setDecimalAutoFilled(Boolean(decimals));

    handleCustomSymbolChange(symbol || '');
    handleCustomDecimalsChange(decimals);
  };

  const handleToggleToken = (token) => {
    const { address } = token;
    const selectedTokensCopy = { ...selectedTokens };

    if (address in selectedTokensCopy) {
      delete selectedTokensCopy[address];
    } else {
      selectedTokensCopy[address] = token;
    }

    setSelectedTokens(selectedTokensCopy);
    setTokenSelectorError(null);
  };

  const hasError = () => {
    return (
      tokenSelectorError ||
      customAddressError ||
      customSymbolError ||
      customDecimalsError ||
      nftAddressError
    );
  };

  const hasSelected = () => {
    return customAddress || Object.keys(selectedTokens).length > 0;
  };

  const handleNext = () => {
    if (hasError()) {
      return;
    }

    if (!hasSelected()) {
      setTokenSelectorError(t('mustSelectOne'));
      return;
    }

    const tokenAddressList = Object.keys(tokenList);
    const customToken = {
      address: customAddress,
      symbol: customSymbol,
      decimals: customDecimals,
      standard: tokenStandard,
    };

    dispatch(
      setPendingTokens({ customToken, selectedTokens, tokenAddressList }),
    );
    setMode('confirm');
  };

  const handleCustomAddressChange = async (value) => {
    const address = value.trim();

    setCustomAddress(address);
    setCustomAddressError(null);
    setNftAddressError(null);
    setSymbolAutoFilled(false);
    setDecimalAutoFilled(false);
    setMainnetTokenWarning(null);

    const addressIsValid = isValidHexAddress(address, {
      allowNonPrefixed: false,
    });
    const standardAddress = addHexPrefix(address).toLowerCase();

    const isMainnetToken = Object.keys(STATIC_MAINNET_TOKEN_LIST).some(
      (key) => key.toLowerCase() === address.toLowerCase(),
    );

    let standard;
    if (addressIsValid) {
      try {
        ({ standard } = await getTokenStandardAndDetails(
          standardAddress,
          selectedAddress,
          null,
        ));
      } catch (error) {
        // ignore
      }
    }

    const addressIsEmpty = address.length === 0 || address === EMPTY_ADDRESS;

    switch (true) {
      case !addressIsValid && !addressIsEmpty:
        setCustomAddressError(t('invalidAddress'));
        setCustomSymbol('');
        setCustomDecimals(0);
        setCustomSymbolError(null);
        setCustomDecimalsError(null);
        break;

      case standard === TokenStandard.ERC1155 || TokenStandard.ERC721:
        setNftAddressError(
          t('nftAddressError', [
            <a
              className="import-token__nft-address-error-link"
              onClick={() =>
                history.push({
                  pathname: ADD_NFT_ROUTE,
                  state: {
                    addressEnteredOnImportTokensPage: customAddress,
                  },
                })
              }
              key="nftAddressError"
            >
              {t('importNFTPage')}
            </a>,
          ]),
        );
        break;

      case isMainnetToken && !isMainnet:
        setMainnetTokenWarning(t('mainnetToken'));
        setCustomSymbol('');
        setCustomDecimals(0);
        setCustomSymbolError(null);
        setCustomDecimalsError(null);
        break;

      case Boolean(identities[standardAddress]):
        setCustomAddressError(t('personalAddressDetected'));
        break;

      case checkExistingAddresses(address, tokens):
        setCustomAddressError(t('tokenAlreadyAdded'));
        break;

      default:
        if (!addressIsEmpty) {
          attemptToAutoFillTokenParams(address);
          if (standard) {
            setTokenStandard(standard);
          }
        }
    }
  };

  const isConfirming = mode === 'confirm';

  return (
    <Popover
      onBack={isConfirming ? () => setMode('') : null}
      onClose={onClose}
      centerTitle
      title={t('importTokensCamelCase')}
      className="import-tokens-popover"
    >
      {isConfirming ? (
        <Box padding={[0, 6, 6, 6]}>
          <Text>{t('likeToImportTokens')}</Text>
          <Box marginTop={4} marginBottom={4}>
            <Box display={Display.Flex}>
              <Text variant={TextVariant.bodySm} style={{flex: 1}}>{t('token')}</Text>
              <Text variant={TextVariant.bodySm} style={{flex: '0 0 30%'}}>{t('balance')}</Text>
            </Box>
            <Box display={Display.Flex} style={{flexFlow: 'column nowrap'}}>
              {Object.entries(pendingTokens).map(([address, token]) => {
                const { name, symbol } = token;
                return (
                  <Box key={address} display={Display.Flex} alignItems={AlignItems.center} style={{flexFlow: 'row nowrap', }}>
                    <Box display={Display.Flex} alignItems={AlignItems.center}>
                      <Identicon diameter={48} address={address} />
                      <Box marginInlineEnd={4}>{getTokenName(name, symbol)}</Box>
                    </Box>
                    <Box style={{flex: '0 0 30%'}}>
                      <TokenBalance token={token} />
                    </Box>
                  </Box>
                );
              })}
            </Box>
            <Box display={Display.Flex} gap={2}>
              <ButtonSecondary
                onClick={() => {
                  dispatch(clearPendingTokens());
                  setMode('');
                }}
                block
              >
                {t('back')}
              </ButtonSecondary>
              <ButtonPrimary onClick={handleAddTokens} block>
                {t('import')}
              </ButtonPrimary>
            </Box>
          </Box>
        </Box>
      ) : (
        <>
          <Tabs t={t}>
            {showSearchTab ? (
              <Tab tabKey="search" name={t('search')}>
                <Box className="import-token__search-token">
                  {useTokenDetection ? null : (
                    <BannerAlert severity={Severity.Info}>
                      <Text>
                        {t('enhancedTokenDetectionAlertMessage', [
                          networkName,
                          <ButtonLink
                            key="token-detection-announcement"
                            onClick={() =>
                              history.push(
                                `${SECURITY_ROUTE}#token-description`,
                              )
                            }
                          >
                            {t('enableFromSettings')}
                          </ButtonLink>,
                        ])}
                      </Text>
                    </BannerAlert>
                  )}
                  <TokenSearch
                    onSearch={({ results = [] }) => setSearchResults(results)}
                    error={tokenSelectorError}
                    tokenList={tokenList}
                  />
                  <Box className="import-token__token-list">
                    <TokenList
                      results={searchResults}
                      selectedTokens={selectedTokens}
                      onToggleToken={(token) => handleToggleToken(token)}
                    />
                  </Box>
                </Box>
              </Tab>
            ) : null}
            <Tab tabKey="customToken" name={t('customToken')}>
              <div className="import-token__custom-token-form">
                {tokenDetectionInactiveOnNonMainnetSupportedNetwork ? (
                  <BannerAlert severity={Severity.Warning}>
                    {t('customTokenWarningInTokenDetectionNetworkWithTDOFF', [
                      <ButtonLink
                        key="import-token-security-risk"
                        rel="noopener noreferrer"
                        target="_blank"
                        href={ZENDESK_URLS.TOKEN_SAFETY_PRACTICES}
                      >
                        {t('tokenScamSecurityRisk')}
                      </ButtonLink>,
                      <ButtonLink
                        type="link"
                        key="import-token-token-detection-announcement"
                        onClick={() =>
                          history.push(`${SECURITY_ROUTE}#token-description`)
                        }
                      >
                        {t('inYourSettings')}
                      </ButtonLink>,
                    ])}
                  </BannerAlert>
                ) : (
                  <BannerAlert
                    severity={
                      isDynamicTokenListAvailable
                        ? Severity.Warning
                        : Severity.Info
                    }
                  >
                    {t(
                      isDynamicTokenListAvailable
                        ? 'customTokenWarningInTokenDetectionNetwork'
                        : 'customTokenWarningInNonTokenDetectionNetwork',
                      [
                        <ButtonLink
                          key="import-token-fake-token-warning"
                          rel="noopener noreferrer"
                          target="_blank"
                          href={ZENDESK_URLS.TOKEN_SAFETY_PRACTICES}
                        >
                          {t('learnScamRisk')}
                        </ButtonLink>,
                      ],
                    )}
                  </BannerAlert>
                )}
                <FormTextField
                  label={t('tokenContractAddress')}
                  value={customAddress}
                  onChange={(e) => handleCustomAddressChange(e.target.value)}
                  helpText={
                    customAddressError || mainnetTokenWarning || nftAddressError
                  }
                  error={
                    customAddressError || mainnetTokenWarning || nftAddressError
                  }
                  autoFocus
                  marginTop={6}
                />
                <FormTextField
                  label={
                    <>
                      {t('tokenSymbol')}
                      {symbolAutoFilled && !forceEditSymbol && (
                        <div
                          className="import-token__custom-symbol__edit"
                          onClick={() => setForceEditSymbol(true)}
                        >
                          {t('edit')}
                        </div>
                      )}
                    </>
                  }
                  value={customSymbol}
                  onChange={(e) => handleCustomSymbolChange(e.target.value)}
                  helpText={customSymbolError}
                  error={customSymbolError}
                  disabled={symbolAutoFilled && !forceEditSymbol}
                  marginTop={6}
                />
                <FormTextField
                  label={t('decimal')}
                  type="number"
                  value={customDecimals}
                  onChange={(e) => handleCustomDecimalsChange(e.target.value)}
                  helpText={customDecimalsError}
                  error={customDecimalsError}
                  disabled={decimalAutoFilled}
                  min={MIN_DECIMAL_VALUE}
                  max={MAX_DECIMAL_VALUE}
                  marginTop={6}
                />
                {customDecimals === '' && (
                  <BannerAlert severity={Severity.Warning}>
                    <Text fontWeight={FontWeight.Bold}>
                      {t('tokenDecimalFetchFailed')}
                    </Text>
                    {t('verifyThisTokenDecimalOn', [
                      <ButtonLink
                        key="import-token-verify-token-decimal"
                        rel="noopener noreferrer"
                        target="_blank"
                        href={blockExplorerTokenLink}
                      >
                        {blockExplorerLabel}
                      </ButtonLink>,
                    ])}
                  </BannerAlert>
                )}
              </div>
            </Tab>
          </Tabs>
          <Box padding={6}>
            <ButtonPrimary
              onClick={() => handleNext()}
              disabled={Boolean(hasError()) || !hasSelected()}
              block
            >
              {t('next')}
            </ButtonPrimary>
          </Box>
        </>
      )}
    </Popover>
  );
};

ImportTokensPopover.propTypes = {
  onClose: PropTypes.func.isRequired,
};
