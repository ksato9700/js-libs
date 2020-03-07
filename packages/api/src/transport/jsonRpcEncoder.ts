// Copyright 2015-2020 Parity Technologies (UK) Ltd.
// This file is part of Parity.
//
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'eventemitter3';

export default class JsonRpcEncoder extends EventEmitter {
  _id: number;

  constructor() {
    super();

    this._id = 1;
  }

  encodeObject(method: string, params: any) {
    return {
      id: this._id++,
      jsonrpc: '2.0',
      method: method,
      params: params,
    };
  }

  encode(method: string, params: any) {
    return JSON.stringify(this.encodeObject(method, params));
  }

  get id() {
    return this._id;
  }
}
