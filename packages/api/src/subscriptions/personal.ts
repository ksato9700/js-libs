// Copyright 2015-2020 Parity Technologies (UK) Ltd.
// This file is part of Parity.
//
// SPDX-License-Identifier: MIT
export type Account = string;
export type Info = string;
export type UpdateSubscriptionsFunc = (
  name: string,
  error: Error | null,
  data: Account | Account[]
) => void;

export default class Personal {
  _subscriber: any;
  _api: any;
  _updateSubscriptions: UpdateSubscriptionsFunc;
  _started: boolean;
  _lastDefaultAccount: string;
  _pollTimerId: NodeJS.Timeout | null;

  constructor(
    updateSubscriptions: UpdateSubscriptionsFunc,
    api: any,
    subscriber: any
  ) {
    this._subscriber = subscriber;
    this._api = api;
    this._updateSubscriptions = updateSubscriptions;
    this._started = false;

    this._lastDefaultAccount = '0x0';
    this._pollTimerId = null;

    this._api.provider.on('close', () => {
      if (this.isStarted) {
        this.start();
      }
    });
  }

  get isStarted() {
    return this._started;
  }

  start(): Promise<any> {
    this._started = true;

    const defaultAccount = this._api.isPubSub
      ? this._api.pubsub.subscribeAndGetResult(
          (callback: () => void) =>
            this._api.pubsub.parity.defaultAccount(callback),
          (defaultAccount: Account) => {
            this.updateDefaultAccount(defaultAccount);
            return defaultAccount;
          }
        )
      : this._defaultAccount();

    return Promise.all([
      defaultAccount,
      this._listAccounts(),
      this._accountsInfo(),
      this._loggingSubscribe(),
    ]);
  }

  updateDefaultAccount(defaultAccount: Account) {
    if (this._lastDefaultAccount !== defaultAccount) {
      this._lastDefaultAccount = defaultAccount;
      this._updateSubscriptions('parity_defaultAccount', null, defaultAccount);
    }
  }

  // FIXME: Because of the different API instances, the "wait for valid changes" approach
  // doesn't work. Since the defaultAccount is critical to operation, we poll in exactly
  // same way we do in ../eth (ala eth_blockNumber) and update. This should be moved
  // to pub-sub as it becomes available
  _defaultAccount(timerDisabled = false) {
    const nextTimeout = (timeout = 3000) => {
      if (!timerDisabled) {
        this._pollTimerId = setTimeout(() => {
          this._defaultAccount();
        }, timeout);
      }
    };

    if (!this._api.isConnected) {
      nextTimeout(500);
      return;
    }

    return this._api.parity
      .defaultAccount()
      .then((defaultAccount: Account) => {
        this.updateDefaultAccount(defaultAccount);
        nextTimeout();
      })
      .catch(() => nextTimeout());
  }

  _listAccounts() {
    return this._api.eth.accounts().then((accounts: Account[]) => {
      this._updateSubscriptions('eth_accounts', null, accounts);
    });
  }

  _accountsInfo() {
    return this._api.parity.accountsInfo().then((info: Info) => {
      this._updateSubscriptions('parity_accountsInfo', null, info);

      return this._api.parity
        .allAccountsInfo()
        .catch(() => {
          // NOTE: This fails on non-secure APIs, swallow error
          return {};
        })
        .then((allInfo: Info[]) => {
          this._updateSubscriptions('parity_allAccountsInfo', null, allInfo);
        });
    });
  }

  _loggingSubscribe() {
    return this._subscriber.subscribe('logging', (error: Error, data: any) => {
      if (error || !data) {
        return;
      }

      switch (data.method) {
        case 'parity_closeVault':
        case 'parity_openVault':
        case 'parity_killAccount':
        case 'parity_importGethAccounts':
        case 'parity_newAccountFromPhrase':
        case 'parity_newAccountFromWallet':
        case 'personal_newAccount':
          this._defaultAccount(true);
          this._listAccounts();
          this._accountsInfo();
          break;

        case 'parity_removeAddress':
        case 'parity_setAccountName':
        case 'parity_setAccountMeta':
          this._accountsInfo();
          break;

        case 'parity_setDappAddresses':
        case 'parity_setDappDefaultAddress':
        case 'parity_setNewDappsAddresses':
        case 'parity_setNewDappsDefaultAddress':
          this._defaultAccount(true);
          this._listAccounts();
          break;
      }
    });
  }
}
