// Copyright 2015-2020 Parity Technologies (UK) Ltd.
// This file is part of Parity.
//
// SPDX-License-Identifier: MIT

/* eslint-disable no-unused-expressions */

import Manager, { events } from './manager';
import { Engine, UpdateSubscriptionsFunc } from './engine';

function newStub(): Manager {
  const start = () => manager._updateSubscriptions('test', null, 'test');

  const manager = new Manager({
    provider: {
      isConnected: true,
      on: jest.fn(),
    },
    engines: {
      eth: {
        isStarted: false,
        start,
      },
      personal: {
        isStarted: false,
        start,
      },
      signer: {
        isStarted: false,
        start,
      },
    },
  });
  return manager;
}

describe('subscriptions/manager', () => {
  let manager: Manager;

  beforeEach(() => {
    manager = newStub();
  });

  describe('constructor', () => {
    it('sets up the subscription types & defaults', () => {
      expect(Array.isArray(manager.subscriptions)).toBe(true);
      expect(Object.keys(manager.values)).toStrictEqual(Object.keys(events));
    });
  });

  describe('subscriptions', () => {
    Object.keys(events)
      .filter(eventName => eventName.indexOf('_') !== -1)
      .forEach(eventName => {
        const { module } = events[eventName];
        let engine: Engine;
        let cb: UpdateSubscriptionsFunc;
        let subscriptionId: number;

        describe(eventName, () => {
          beforeEach(() => {
            engine = manager.engine(module);
            cb = jest.fn();
            jest.spyOn(engine, 'start');

            return manager
              .subscribe(eventName, cb)
              .then((_subscriptionId: number) => {
                subscriptionId = _subscriptionId;
              });
          });

          it(`puts the ${module} engine in a started state`, () => {
            expect(engine.start).toHaveBeenCalled;
          });

          it('calls the subscription callback with updated values', () => {
            expect(cb).toHaveBeenCalledWith(null, 'test');
          });
        });
      });
  });

  // describe('unsubscriptions', () => {
  //   Object.keys(events)
  //     .filter(eventName => eventName.indexOf('_') !== -1)
  //     .forEach(eventName => {
  //       const { module } = events[eventName];
  //       let engine;
  //       let cb: UpdateSubscriptionsFunc;

  //       describe(eventName, () => {
  //         beforeEach(() => {
  //           engine = manager.engine(module);
  //           cb = jest.fn();
  //           jest.spyOn(engine, 'start');

  //           return manager
  //             .subscribe(eventName, cb)
  //             .then((subscriptionId: number) => {
  //               manager.unsubscribe(subscriptionId);
  //             })
  //             .then(() => {
  //               manager._updateSubscriptions(eventName, null, 'test2');
  //             });
  //         });

  //         it('does not call the callback after unsubscription', () => {
  //           expect(cb).toHaveBeenCalledWith(null, 'test');
  //           expect(cb).not.toHaveBeenCalledWith(null, 'test2');
  //         });
  //       });
  //     });
  // });
});
