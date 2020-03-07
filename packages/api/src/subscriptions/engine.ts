// Copyright 2015-2020 Parity Technologies (UK) Ltd.
// This file is part of Parity.
//
// SPDX-License-Identifier: MIT

export interface Engine {
  readonly isStarted: boolean;
  start(): Promise<any>;
}

export type UpdateSubscriptionsFunc = (
  name: string,
  error: Error | null,
  data: any
) => void;
