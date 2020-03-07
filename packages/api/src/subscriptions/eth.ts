// Copyright 2015-2020 Parity Technologies (UK) Ltd.
// This file is part of Parity.
//
// SPDX-License-Identifier: MIT

import BigNumber from 'bignumber.js';
import { Engine, UpdateSubscriptionsFunc } from './engine';

export default class Eth implements Engine {
  api: any;
  updateSubscriptions: UpdateSubscriptionsFunc;
  started: boolean;
  lastBlock: BigNumber;
  pollTimerId: NodeJS.Timeout | null;

  constructor(updateSubscriptions: UpdateSubscriptionsFunc, api: any) {
    this.api = api;
    this.updateSubscriptions = updateSubscriptions;
    this.started = false;
    this.lastBlock = new BigNumber(-1);
    this.pollTimerId = null;

    this.api.provider.on('close', () => {
      if (this.isStarted) {
        this.start();
      }
    });
  }

  get isStarted(): boolean {
    return this.started;
  }

  start(): Promise<any> {
    this.started = true;

    if (this.api.isPubSub) {
      return Promise.all([
        this._pollBlockNumber(false),
        this.api.pubsub.subscribeAndGetResult(
          (callback: () => void) => this.api.pubsub.eth.newHeads(callback),
          () => {
            return this.api.eth.blockNumber().then((blockNumber: BigNumber) => {
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
        this.pollTimerId = setTimeout(() => {
          this._pollBlockNumber(doTimeout);
        }, timeout);
      }
    };

    if (!this.api.provider.isConnected) {
      nextTimeout(500, true);
      return Promise.resolve();
    }

    return this.api.eth
      .blockNumber()
      .then((blockNumber: BigNumber) => {
        this.updateBlock(blockNumber);

        nextTimeout();
      })
      .catch(() => nextTimeout());
  }

  updateBlock(blockNumber: BigNumber) {
    if (!blockNumber.eq(this.lastBlock)) {
      this.lastBlock = blockNumber;
      this.updateSubscriptions('eth_blockNumber', null, blockNumber);
    }
  }
}
