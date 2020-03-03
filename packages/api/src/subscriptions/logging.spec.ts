// Copyright 2015-2020 Parity Technologies (UK) Ltd.
// This file is part of Parity.
//
// SPDX-License-Identifier: MIT

/* eslint-disable no-unused-expressions */

import Logging from './logging';
import { UpdateSubscriptionsFunc } from './logging';

describe('subscriptions/logging', () => {
  let cb: UpdateSubscriptionsFunc;
  let logging: Logging;

  beforeEach(() => {
    cb = jest.fn();
    logging = new Logging(cb);
  });

  describe('constructor', () => {
    it('starts the instance in a started state', () => {
      expect(logging.isStarted).toBe(true);
    });
  });

  describe('send', () => {
    const method = 'method';
    const params = 'params';
    const json = 'json';

    beforeEach(() => {
      Logging.send(method, params, json);
    });

    it('calls the subscription update', () => {
      expect(cb).toHaveBeenCalledWith('logging', null, {
        method,
        params,
        json,
      });
    });
  });
});
