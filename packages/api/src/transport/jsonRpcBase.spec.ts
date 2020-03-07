// Copyright 2015-2020 Parity Technologies (UK) Ltd.
// This file is part of Parity.
//
// SPDX-License-Identifier: MIT

/* eslint-disable no-unused-expressions */

import { isInstanceOf } from '../util/types';
import JsonRpcBase from './jsonRpcBase';

const base = new JsonRpcBase();

describe('transport/JsonRpcBase', () => {
  describe('addMiddleware', () => {
    it('checks for Middleware null', done => {
      const base2 = new JsonRpcBase();

      base2.addMiddleware(null);
      base2._middlewareList.then(list => {
        expect(list).toStrictEqual([]);
        done();
      });
    });

    it('intialises Middleware added', done => {
      const base2 = new JsonRpcBase();

      class Middleware {
        constructor(parent: any) {
          expect(parent).toBe(base2);
        }
      }

      base2.addMiddleware(Middleware);
      base2._middlewareList.then(list => {
        expect(list.length).toBe(1);
        expect(isInstanceOf(list[0], Middleware)).toBe(true);
        done();
      });
    });
  });

  describe('setDebug', () => {
    it('starts with disabled flag', () => {
      expect(base.isDebug).toBe(false);
    });

    it('true flag switches on', () => {
      base.setDebug(true);
      expect(base.isDebug).toBe(true);
    });

    it('false flag switches off', () => {
      base.setDebug(true);
      expect(base.isDebug).toBe(true);
      base.setDebug(false);
      expect(base.isDebug).toBe(false);
    });

    describe('logging', () => {
      beforeEach(() => {
        jest.spyOn(console, 'log');
        jest.spyOn(console, 'error');
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it('does not log errors with flag off', () => {
        base.setDebug(false);
        base.log('error');
        expect(console.log).not.toBeCalled();
      });

      it('does not log errors with flag off', () => {
        base.setDebug(false);
        base.error('error');
        expect(console.error).not.toBeCalled();
      });

      it('does log errors with flag on', () => {
        base.setDebug(true);
        base.log('error');
        expect(console.log).toBeCalled();
      });

      it('does log errors with flag on', () => {
        base.setDebug(true);
        base.error('error');
        expect(console.error).toBeCalled();
      });
    });
  });
});
