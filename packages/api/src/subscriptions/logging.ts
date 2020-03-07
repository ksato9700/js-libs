// Copyright 2015-2020 Parity Technologies (UK) Ltd.
// This file is part of Parity.
//
// SPDX-License-Identifier: MIT

import { Engine, UpdateSubscriptionsFunc } from './engine';

let instance: Logging | null = null;

export interface UpdateData {
  method: string;
  params: any;
  json: string;
}

export default class Logging implements Engine {
  private _updateSubscriptions: UpdateSubscriptionsFunc;

  constructor(updateSubscriptions: UpdateSubscriptionsFunc) {
    this._updateSubscriptions = updateSubscriptions;

    instance = this;
  }

  get isStarted(): boolean {
    return true;
  }

  start(): Promise<any> {
    return Promise.resolve(true);
  }

  static send(method: string, params: any, json: string): any {
    if (!instance) {
      return;
    }

    return instance._updateSubscriptions('logging', null, {
      method,
      params,
      json,
    });
  }
}
