// Copyright 2015-2020 Parity Technologies (UK) Ltd.
// This file is part of Parity.
//
// SPDX-License-Identifier: MIT

import { TransportError, ERROR_CODES } from './error';

describe('transport/Error', () => {
  describe('requestRejected', () => {
    it('creates a Request Rejected error', () => {
      const error = TransportError.requestRejected('method');

      expect(error.code).toBe(ERROR_CODES.REQUEST_REJECTED);
      expect(error.message).toMatch(/been rejected/);
      expect(error.method).toBe('method');
    });
  });
});
