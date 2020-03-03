// Copyright 2015-2020 Parity Technologies (UK) Ltd.
// This file is part of Parity.
//
// SPDX-License-Identifier: MIT

import BigNumber from 'bignumber.js';

export type UpdateSubscriptionsFunc = (
  name: string,
  error: Error | null,
  data: BigNumber
) => void;

export default class Eth {
  _api: any;
  _updateSubscriptions: UpdateSubscriptionsFunc;
  _started: boolean;
  _lastBlock: BigNumber;
  _pollTimerId: NodeJS.Timeout | null;

  constructor(updateSubscriptions: UpdateSubscriptionsFunc, api: any) {
    this._api = api;
    this._updateSubscriptions = updateSubscriptions;
    this._started = false;
    this._lastBlock = new BigNumber(-1);
    this._pollTimerId = null;

    this._api.provider.on('close', () => {
      if (this.isStarted) {
        this.start();
      }
    });
  }

  get isStarted(): boolean {
    return this._started;
  }

  start(): Promise<any> {
    this._started = true;

    if (this._api.isPubSub) {
      return Promise.all([
        this._pollBlockNumber(false),
        this._api.pubsub.subscribeAndGetResult(
          (callback: () => void) => this._api.pubsub.eth.newHeads(callback),
          () => {
            return this._api.eth
              .blockNumber()
              .then((blockNumber: BigNumber) => {
                this.updateBlock(blockNumber);
                return blockNumber;
              });
          }
        ),
      ]);
    }

    return this._pollBlockNumber(true);
  }

  _pollBlockNumber(doTimeout: boolean): Promise<void> {
    const nextTimeout = (timeout = 1000, forceTimeout = doTimeout) => {
      if (forceTimeout) {
        this._pollTimerId = setTimeout(() => {
          this._pollBlockNumber(doTimeout);
        }, timeout);
      }
    };

    if (!this._api.provider.isConnected) {
      nextTimeout(500, true);
      return Promise.resolve();
    }

    return this._api.eth
      .blockNumber()
      .then((blockNumber: BigNumber) => {
        this.updateBlock(blockNumber);

        nextTimeout();
      })
      .catch(() => nextTimeout());
  }

  updateBlock(blockNumber: BigNumber) {
    if (!blockNumber.eq(this._lastBlock)) {
      this._lastBlock = blockNumber;
      this._updateSubscriptions('eth_blockNumber', null, blockNumber);
    }
  }
}
