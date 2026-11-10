/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Activity } from './Activity';
import { activityReducer, activitySlice, ActivityState } from './activitySlice';

const activity = {
  id: 'details-1',
  title: 'Details',
  content: null,
  location: 'split-right',
} as unknown as Activity;

const state: ActivityState = {
  history: [activity.id],
  activities: { [activity.id]: activity },
};

describe('activitySlice resize timer', () => {
  let windowDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
  });

  afterEach(() => {
    if (windowDescriptor) {
      Object.defineProperty(globalThis, 'window', windowDescriptor);
    }
    vi.useRealTimers();
  });

  it('does not throw when the delayed resize fires after the window is gone', () => {
    activityReducer(state, activitySlice.actions.update({ id: activity.id, minimized: false }));

    // The reducers dispatch a resize event 200ms later. That timer can outlive
    // the page, e.g. when a test file ends and its jsdom environment is torn
    // down, so `window` is no longer defined at all when it fires.
    delete (globalThis as { window?: unknown }).window;
    expect(typeof window).toBe('undefined');

    expect(() => vi.advanceTimersByTime(200)).not.toThrow();
  });

  it('still dispatches the resize event when the window exists', () => {
    const onResize = vi.fn();
    window.addEventListener('resize', onResize);

    activityReducer(state, activitySlice.actions.update({ id: activity.id, minimized: false }));
    vi.advanceTimersByTime(200);

    expect(onResize).toHaveBeenCalledTimes(1);
    window.removeEventListener('resize', onResize);
  });
});
