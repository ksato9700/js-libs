// Copyright 2015-2020 Parity Technologies (UK) Ltd.
// This file is part of Parity.
//
// SPDX-License-Identifier: MIT

/* eslint-disable no-unused-expressions */

import Personal from './personal';
import { Account, Info, UpdateSubscriptionsFunc } from './personal';

const TEST_DEFAULT = '0xfa64203C044691aA57251aF95f4b48d85eC00Dd5';
const TEST_INFO = {
  [TEST_DEFAULT]: {
    name: 'test',
  },
};
const TEST_LIST = [TEST_DEFAULT];

function stubApi(accounts?: Account[], info?: Info) {
  const _calls = {
    accountsInfo: new Array<Promise<Info>>(),
    allAccountsInfo: new Array<Promise<Info>>(),
    listAccounts: new Array<Promise<Account>>(),
    defaultAccount: new Array<Promise<Account>>(),
  };

  return {
    _calls,
    isConnected: true,
    provider: {
      isConnected: true,
      on: jest.fn(),
    },
    parity: {
      accountsInfo: () => {
        const stub: Promise<Info> = jest
          .fn()
          .mockResolvedValue(info || TEST_INFO)();
        _calls.accountsInfo.push(stub);
        return stub;
      },
      allAccountsInfo: () => {
        const stub: Promise<Info> = jest
          .fn()
          .mockResolvedValue(info || TEST_INFO)();
        _calls.allAccountsInfo.push(stub);
        return stub;
      },
      defaultAccount: () => {
        const stub: Promise<Account> = jest
          .fn()
          .mockResolvedValue(Object.keys(info || TEST_INFO)[0])();
        _calls.defaultAccount.push(stub);
        return stub;
      },
    },
    eth: {
      accounts: () => {
        const stub: Promise<Account> = jest
          .fn()
          .mockResolvedValue(accounts || TEST_LIST)();
        _calls.listAccounts.push(stub);
        return stub;
      },
    },
  };
}

interface Logging {
  subscribe: jest.Mock<any, any>;
}

function stubLogging(): Logging {
  return {
    subscribe: jest.fn(),
  };
}

describe('subscriptions/personal', () => {
  let api: any;
  let cb: UpdateSubscriptionsFunc;
  let logging: Logging;
  let personal: Personal;

  beforeEach(() => {
    api = stubApi();
    cb = jest.fn();
    logging = stubLogging();
    personal = new Personal(cb, api, logging);
  });

  describe('constructor', () => {
    it('starts the instance in a stopped state', () => {
      expect(personal.isStarted).toBe(false);
    });
  });

  describe('start', () => {
    describe('info available', () => {
      beforeEach(() => {
        return personal.start();
      });

      it('sets the started status', () => {
        expect(personal.isStarted).toBe(true);
      });

      it('calls parity_accountsInfo', () => {
        expect(api._calls.accountsInfo.length).toBeGreaterThan(0);
      });

      it('calls parity_allAccountsInfo', () => {
        expect(api._calls.allAccountsInfo.length).toBeGreaterThan(0);
      });

      it('calls eth_accounts', () => {
        expect(api._calls.listAccounts.length).toBeGreaterThan(0);
      });

      it('updates subscribers', () => {
        expect(cb).toHaveBeenCalledWith(
          'parity_defaultAccount',
          null,
          TEST_DEFAULT
        );
        expect(cb).toHaveBeenCalledWith('eth_accounts', null, TEST_LIST);
        expect(cb).toHaveBeenCalledWith('parity_accountsInfo', null, TEST_INFO);
        expect(cb).toHaveBeenCalledWith(
          'parity_allAccountsInfo',
          null,
          TEST_INFO
        );
      });
    });

    describe('info not available', () => {
      beforeEach(() => {
        api = stubApi(new Array<Account>());
        personal = new Personal(cb, api, logging);
        return personal.start();
      });

      it('sets the started status', () => {
        expect(personal.isStarted).toBe(true);
      });

      it('calls parity_defaultAccount', () => {
        expect(api._calls.defaultAccount.length).toBeGreaterThan(0);
      });

      it('calls personal_accountsInfo', () => {
        expect(api._calls.accountsInfo.length).toBeGreaterThan(0);
      });

      it('calls personal_allAccountsInfo', () => {
        expect(api._calls.allAccountsInfo.length).toBeGreaterThan(0);
      });

      it('calls personal_listAccounts', () => {
        expect(api._calls.listAccounts.length).toBeGreaterThan(0);
      });
    });
  });
});
