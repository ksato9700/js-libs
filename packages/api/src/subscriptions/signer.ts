// Copyright 2015-2020 Parity Technologies (UK) Ltd.
// This file is part of Parity.
//
// SPDX-License-Identifier: MIT

import { outTransaction } from '../format/output';
import { Transaction } from '../types';
import { Engine, UpdateSubscriptionsFunc } from './engine';

interface UpdateData {
  method: string;
  params: any;
  json: any;
}

interface Request {
  transaction: Transaction;
  requestId: string;
}

export default class Signer implements Engine {
  _subscriber: any;
  _api: any;
  _updateSubscriptions: UpdateSubscriptionsFunc;
  _started: boolean;

  constructor(
    updateSubscriptions: UpdateSubscriptionsFunc,
    api: any,
    subscriber: any
  ) {
    this._subscriber = subscriber;
    this._api = api;
    this._updateSubscriptions = updateSubscriptions;
    this._started = false;

    this._api.provider.on('close', () => {
      if (this.isStarted) {
        this.start();
      }
    });
  }

  get isStarted(): boolean {
    return this._started;
  }

  start(): Promise<Array<any>> {
    this._started = true;

    if (this._api.isPubSub) {
      const subscription = this._api.pubsub.subscribeAndGetResult(
        (callback: () => void) =>
          this._api.pubsub.signer.pendingRequests(callback),
        (requests: Request[]) => {
          this.updateSubscriptions(requests);
          return requests;
        }
      );
      return Promise.all([this._listRequests(false), subscription]);
    }
    return Promise.all([this._listRequests(true), this._loggingSubscribe()]);
  }

  updateSubscriptions(requests: Request[]) {
    return this._updateSubscriptions(
      'signer_requestsToConfirm',
      null,
      requests
    );
  }

  _listRequests(doTimeout: boolean) {
    const nextTimeout = (timeout = 1000, forceTimeout = doTimeout) => {
      if (forceTimeout) {
        setTimeout(() => {
          this._listRequests(doTimeout);
        }, timeout);
      }
    };

    if (!this._api.isConnected) {
      nextTimeout(500, true);
      return;
    }

    return this._api.signer
      .requestsToConfirm()
      .then((requests: Request[]) => {
        this.updateSubscriptions(requests);
        nextTimeout();
      })
      .catch(() => nextTimeout());
  }

  _postTransaction(data: UpdateData) {
    const request: Request = {
      transaction: outTransaction(data.params[0]),
      requestId: data.json.result.result,
    };

    this._updateSubscriptions('parity_postTransaction', null, [request]);
  }

  _loggingSubscribe() {
    return this._subscriber.subscribe(
      'logging',
      (error: Error, data: UpdateData) => {
        if (error || !data) {
          return;
        }

        switch (data.method) {
          case 'eth_sendTransaction':
          case 'eth_sendRawTransaction':
            this._listRequests(false);
            break;

          case 'parity_postTransaction':
            this._postTransaction(data);
            this._listRequests(false);
            break;
        }
      }
    );
  }
}
