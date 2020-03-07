// Copyright 2015-2020 Parity Technologies (UK) Ltd.
// This file is part of Parity.
//
// SPDX-License-Identifier: MIT

/* eslint-disable no-unused-expressions */

import JsonRpcEncoder from './jsonRpcEncoder';

const encoder = new JsonRpcEncoder();

describe('transport/JsonRpcEncoder', () => {
  describe('encodeObject', () => {
    it('encodes the body correctly, incrementing id', () => {
      const id = encoder.id;
      const bdy = encoder.encodeObject('someMethod', ['param1', 'param2']);
      const enc = {
        id,
        jsonrpc: '2.0',
        method: 'someMethod',
        params: ['param1', 'param2'],
      };

      expect(bdy).toStrictEqual(enc);
      expect(encoder.id - id).toBe(1);
    });
  });

  describe('encode', () => {
    it('encodes the body correctly, incrementing id', () => {
      const id = encoder.id;
      const bdy = encoder.encode('someMethod', ['param1', 'param2']);
      const enc = `{"id":${id},"jsonrpc":"2.0","method":"someMethod","params":["param1","param2"]}`;

      expect(bdy).toStrictEqual(enc);
      expect(encoder.id - id).toBe(1);
    });
  });
});
