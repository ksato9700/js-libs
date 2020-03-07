// Copyright 2015-2020 Parity Technologies (UK) Ltd.
// This file is part of Parity.
//
// SPDX-License-Identifier: MIT

import { isError } from '../util/types';

import { Engine, UpdateSubscriptionsFunc } from './engine';
import Eth from './eth';
import Logging from './logging';
import Personal from './personal';
import Signer from './signer';

type Module = { module: string };

export const events: { [name: string]: Module } = {
  logging: { module: 'logging' },
  eth_blockNumber: { module: 'eth' },
  parity_accountsInfo: { module: 'personal' },
  parity_allAccountsInfo: { module: 'personal' },
  parity_defaultAccount: { module: 'personal' },
  parity_postTransaction: { module: 'signer' },
  eth_accounts: { module: 'personal' },
  signer_requestsToConfirm: { module: 'signer' },
};

type Engines = { [name: string]: Engine };

export default class Manager {
  api: any;
  engines: Engines;
  subscriptions: any[];
  values: { [name: string]: { error: Error | null; data: any } };

  constructor(api: any, engines: Engines = {}) {
    this.api = api;
    this.engines = engines;
    this.subscriptions = [];
    this.values = {};

    Object.keys(events).forEach((subscriptionName: string) => {
      this.values[subscriptionName] = {
        error: null,
        data: null,
      };
    });

    // in the case of a pubsub compliant, don't use the engines
    if (this.api.isPubSub) {
      return;
    }
    this.engines.logging = new Logging(this._updateSubscriptions);
    this.engines.eth = new Eth(this._updateSubscriptions, api);
    this.engines.personal = new Personal(this._updateSubscriptions, api, this);
    this.engines.signer = new Signer(this._updateSubscriptions, api, this);
  }

  _validateType(subscriptionName: string): Module | Error {
    const subscription = events[subscriptionName];

    if (!subscription) {
      return new Error(
        `${subscriptionName} is not a valid interface, subscribe using one of ${Object.keys(
          events
        ).join(', ')}`
      );
    }

    return subscription;
  }

  engine(name: string): Engine {
    return this.engines[name];
  }

  subscribe(
    subscriptionName: string,
    callback: UpdateSubscriptionsFunc,
    autoRemove: boolean = false
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      const subscription = this._validateType(subscriptionName);

      if (isError(subscription)) {
        reject(subscription);
        return;
      }

      // use normal pub-sub as available
      if (this.api.isPubSub) {
        try {
          const [fnSection, fnName] = subscriptionName.split('_');
          resolve(this.api.pubsub[fnSection][fnName](callback));
        } catch (error) {
          console.error('Unable to find subscriptionName', subscriptionName);
          reject(error);
        }
        return;
      }

      const subscriptionId = this.subscriptions.length;
      const { error, data } = this.values[subscriptionName];
      const engine = this.engines[subscription.module];

      this.subscriptions[subscriptionId] = {
        name: subscriptionName,
        id: subscriptionId,
        autoRemove,
        callback,
      };

      if (!engine.isStarted) {
        engine.start();
      } else if (error !== null || data !== null) {
        this._sendData(subscriptionId, error, data);
      }

      resolve(subscriptionId);
    });
  }

  unsubscribe(subscriptionId: number): Promise<void | Error> {
    if (this.api.isPubSub) {
      return this.api.pubsub.unsubscribe(subscriptionId);
    }

    return new Promise((resolve, reject) => {
      if (!this.subscriptions[subscriptionId]) {
        reject(new Error(`Cannot find subscription ${subscriptionId}`));
        return;
      }

      delete this.subscriptions[subscriptionId];
      resolve();
    });
  }

  _sendData(subscriptionId: number, error: Error | null, data: any) {
    const { autoRemove, callback } = this.subscriptions[subscriptionId];
    let result = true;

    try {
      result = callback(error, data);
    } catch (error) {
      console.error(
        `Unable to update callback for subscriptionId ${subscriptionId}`,
        error
      );
    }

    if (autoRemove && result && typeof result === 'boolean') {
      this.unsubscribe(subscriptionId);
    }
  }

  _updateSubscriptions(
    subscriptionName: string,
    error: Error | null,
    data: any
  ) {
    const subscriptions = this.subscriptions.filter(
      subscription => subscription.name === subscriptionName
    );

    this.values[subscriptionName] = { error, data };

    subscriptions.forEach(subscription => {
      this._sendData(subscription.id, error, data);
    });
  }
}
