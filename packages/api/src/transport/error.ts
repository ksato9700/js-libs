// Copyright 2015-2020 Parity Technologies (UK) Ltd.
// This file is part of Parity.
//
// SPDX-License-Identifier: MIT

export const ERROR_CODES: { [name: string]: number } = {
  UNSUPPORTED_REQUEST: -32000,
  NO_WORK: -32001,
  NO_AUTHOR: -32002,
  NO_NEW_WORK: -32003,
  NO_WORK_REQUIRED: -32004,
  NOT_ENOUGH_DATA: -32006,
  UNKNOWN_ERROR: -32009,
  TRANSACTION_ERROR: -32010,
  EXECUTION_ERROR: -32015,
  EXCEPTION_ERROR: -32016,
  ACCOUNT_LOCKED: -32020,
  PASSWORD_INVALID: -32021,
  ACCOUNT_ERROR: -32023,
  SIGNER_DISABLED: -32030,
  DAPPS_DISABLED: -32031,
  NETWORK_DISABLED: -32035,
  REQUEST_REJECTED: -32040,
  REQUEST_REJECTED_LIMIT: -32041,
  REQUEST_NOT_FOUND: -32042,
  COMPILATION_ERROR: -32050,
  ENCRYPTION_ERROR: -32055,
  FETCH_ERROR: -32060,
  INVALID_PARAMS: -32602,
};

export class TransportError extends Error {
  code: number;
  type: string;
  method: string;
  text: string;

  constructor(method: string, code: number, message: string) {
    const m = `${method}: ${code}: ${message}`;

    super(m);

    this.code = code;
    this.type =
      Object.keys(ERROR_CODES).find(key => ERROR_CODES[key] === code) || '';
    this.method = method;
    this.text = message;
  }

  static requestRejected(method: string = '(null)'): TransportError {
    return new TransportError(
      method,
      ERROR_CODES.REQUEST_REJECTED,
      'Request has been rejected.'
    );
  }
}
