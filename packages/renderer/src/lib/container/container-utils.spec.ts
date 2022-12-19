/**********************************************************************
 * Copyright (C) 2022 Red Hat, Inc.
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
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/

import { beforeEach, expect, test, vi } from 'vitest';
import { ContainerUtils } from './container-utils';

let containerUtils: ContainerUtils;

beforeEach(() => {
  vi.clearAllMocks();
  containerUtils = new ContainerUtils();
});

test('should expect valid memory usage', async () => {
  const size = containerUtils.getMemoryUsageTitle(4, 1000000);
  expect(size).toBe('4.00% (1 MB)');
});
