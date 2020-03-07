// Copyright 2015-2020 Parity Technologies (UK) Ltd.
// This file is part of Parity.
//
// SPDX-License-Identifier: MIT

import JsonRpcEncoder from './jsonRpcEncoder';
import { Logging } from '../subscriptions';

interface Result {
  id: number;
  jsonrpc: string;
}
interface SuccessfulResult extends Result {
  result: any;
}
interface UnsuccessfulResult extends Result {
  error: {
    code: string;
    message: string;
  };
}
interface RpcError {
  code: number;
  text: string;
}

export default class JsonRpcBase extends JsonRpcEncoder {
  _debug: boolean;
  _connected: boolean;
  _middlewareList: Promise<any[]>;

  constructor() {
    super();

    this._debug = false;
    this._connected = false;
    this._middlewareList = Promise.resolve([]);
  }

  addMiddleware(Middleware: any): any {
    this._middlewareList = Promise.all([Middleware, this._middlewareList]).then(
      ([Middleware, middlewareList]) => {
        // Do nothing if `handlerPromise` resolves to a null-y value.
        if (!Middleware) {
          return middlewareList;
        }

        // don't mutate the original array
        return middlewareList.concat([new Middleware(this)]);
      }
    );
  }

  _wrapSuccessResult(result: any): SuccessfulResult {
    return {
      id: this._id,
      jsonrpc: '2.0',
      result,
    };
  }

  _wrapErrorResult(error: RpcError) {
    return {
      id: this._id,
      jsonrpc: '2.0',
      error: {
        code: error.code,
        message: error.text,
      },
    };
  }

  execute(method: string, params: any) {
    return this._middlewareList.then(middlewareList => {
      for (const middleware of middlewareList) {
        const res = middleware.handle(method, params);

        if (res != null) {
          return Promise.resolve(res).then(res => {
            const result = this._wrapSuccessResult(res);
            const json = this.encode(method, params);

            Logging.send(method, params, { json, result });

            return res;
          });
        }
      }

      return this._execute(method, params);
    });
  }

  _execute(_method: string, _params: any): void {
    throw new Error('Missing implementation of JsonRpcBase#_execute');
  }

  _setConnected(): void {
    if (!this._connected) {
      this._connected = true;
      this.emit('open');
    }
  }

  _setDisconnected(): void {
    if (this._connected) {
      this._connected = false;
      this.emit('close');
    }
  }

  get isDebug(): boolean {
    return this._debug;
  }

  get isConnected(): boolean {
    return this._connected;
  }

  setDebug(flag: boolean): void {
    this._debug = flag;
  }

  error(error: any): void {
    if (this.isDebug) {
      console.error(error);
    }
  }

  log(log: any): void {
    if (this.isDebug) {
      console.log(log);
    }
  }
}
