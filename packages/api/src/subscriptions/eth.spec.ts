// Copyright 2015-2020 Parity Technologies (UK) Ltd.
// This file is part of Parity.
//
// SPDX-License-Identifier: MIT

/* eslint-disable no-unused-expressions */

import BigNumber from 'bignumber.js';
import Eth, { UpdateSubscriptionsFunc } from './eth';

const START_BLOCK = 5000;

function stubApi(blockNumber?: BigNumber) {
  const _calls = {
    blockNumber: new Array<Promise<BigNumber>>(),
  };

  return {
    _calls,
    provider: {
      isConnected: true,
      on: () => {},
    },
    eth: {
      blockNumber: () => {
        const stub: Promise<BigNumber> = jest
          .fn()
          .mockResolvedValue(new BigNumber(blockNumber || START_BLOCK))();

        _calls.blockNumber.push(stub);
        return stub;
      },
    },
  };
}

describe('subscriptions/eth', () => {
  let api: any;
  let eth: Eth;
  let cb: UpdateSubscriptionsFunc;

  beforeEach(() => {
    api = stubApi();
    cb = jest.fn();
    eth = new Eth(cb, api);
  });

  describe('constructor', () => {
    it('starts the instance in a stopped state', () => {
      expect(eth.isStarted).toBe(false);
    });
  });

  describe('start', () => {
    describe('blockNumber available', () => {
      beforeEach(() => {
        return eth.start();
      });

      it('sets the started status', () => {
        expect(eth.isStarted).toBe(true);
      });

      it('calls eth_blockNumber', () => {
        expect(api._calls.blockNumber.length).toBeGreaterThan(0);
      });

      it('updates subscribers', () => {
        expect(cb).toHaveBeenCalledWith(
          'eth_blockNumber',
          null,
          new BigNumber(START_BLOCK)
        );
      });
    });

    describe('blockNumber not available', () => {
      beforeEach(() => {
        api = stubApi(new BigNumber(-1));
        eth = new Eth(cb, api);
        return eth.start();
      });

      it('sets the started status', () => {
        expect(eth.isStarted).toBe(true);
      });

      it('calls eth_blockNumber', () => {
        expect(api._calls.blockNumber.length).toBeGreaterThan(0);
      });

      it('does not update subscribers', () => {
        expect(cb).not.toHaveBeenCalled();
      });
    });
  });
});
