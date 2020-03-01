// Copyright 2015-2020 Parity Technologies (UK) Ltd.
// This file is part of Parity.
//
// SPDX-License-Identifier: MIT

let instance: Logging | null = null;

export interface UpdateData {
  method: string;
  params: any;
  json: string;
}

export type UpdateSubscriptionsFunc = (
  name: string,
  error: Error | null,
  data: UpdateData
) => void;

export class Logging {
  private _updateSubscriptions: UpdateSubscriptionsFunc;

  constructor(updateSubscriptions: UpdateSubscriptionsFunc) {
    this._updateSubscriptions = updateSubscriptions;

    instance = this;
  }

  get isStarted(): boolean {
    return true;
  }

  start(): void {}

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
