/**********************************************************************
 * Copyright (C) 2023 Red Hat, Inc.
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

/* eslint-disable @typescript-eslint/no-explicit-any */

import '@testing-library/jest-dom/vitest';
import { test, expect, vi, beforeAll, beforeEach, describe } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import PullImage from './PullImage.svelte';
import { providerInfos } from '../../stores/providers';
import type { ProviderStatus } from '@podman-desktop/api';
import type { ProviderContainerConnectionInfo, ProviderInfo } from '../../../../main/src/plugin/api/provider-info';
import userEvent from '@testing-library/user-event';

const pullImageMock = vi.fn();

// fake the window.events object
beforeAll(() => {
  (window.events as unknown) = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    receive: (_channel: string, func: any) => {
      func();
    },
  };
  (window as any).telemetryPage = vi.fn();
  (window as any).getConfigurationValue = vi.fn();
  (window as any).matchMedia = vi.fn().mockReturnValue({
    addListener: vi.fn(),
  });
  (window as any).pullImage = pullImageMock;

  Object.defineProperty(window, 'matchMedia', {
    value: () => {
      return {
        matches: false,
        addListener: () => {},
        removeListener: () => {},
      };
    },
  });
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

const buttonText = 'Pull image';

// the pull image page expects to have a valid provider connection, so let's mock one
function setup() {
  const pStatus: ProviderStatus = 'started';
  const pInfo: ProviderContainerConnectionInfo = {
    name: 'test',
    status: 'started',
    endpoint: {
      socketPath: '',
    },
    type: 'podman',
  };
  const providerInfo = {
    id: 'test',
    internalId: 'id',
    name: '',
    containerConnections: [pInfo],
    kubernetesConnections: undefined,
    status: pStatus,
    containerProviderConnectionCreation: false,
    containerProviderConnectionInitialization: false,
    kubernetesProviderConnectionCreation: false,
    kubernetesProviderConnectionInitialization: false,
    links: undefined,
    detectionChecks: undefined,
    warnings: undefined,
    images: undefined,
    installationSupport: undefined,
  } as unknown as ProviderInfo;
  providerInfos.set([providerInfo]);
}

describe('PullImage', () => {
  test('Expect that textbox is available and button is displayed', async () => {
    setup();
    render(PullImage);

    const entry = screen.getByPlaceholderText('Image name');
    expect(entry).toBeInTheDocument();
    const button = screen.getByRole('button', { name: buttonText });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  test('Expect that whitespace does not enable button', async () => {
    setup();
    render(PullImage, { imageToPull: '   ' });

    const button = screen.getByRole('button', { name: buttonText });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  test('Expect that valid entry enables button', async () => {
    setup();
    render(PullImage, { imageToPull: 'some-valid-image' });

    const button = screen.getByRole('button', { name: buttonText });
    expect(button).toBeInTheDocument();
    expect(button).toBeEnabled();
  });

  test('Expect that valid entry enables button', async () => {
    setup();
    render(PullImage);

    const button = screen.getByRole('button', { name: buttonText });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();

    const textbox = screen.getByRole('textbox', { name: 'imageName' });
    await userEvent.click(textbox);
    await userEvent.paste('some-valid-image');

    expect(button).toBeEnabled();
  });

  test('Expect that action is displayed', async () => {
    setup();
    render(PullImage);

    const regButton = 'Manage registries';
    const button = screen.getByRole('button', { name: regButton });
    expect(button).toBeInTheDocument();
    expect(button).toBeEnabled();
  });

  test('Expect that pull image is reporting an error', async () => {
    setup();
    render(PullImage, { imageToPull: 'image-does-not-exist' });

    // first call to pull image throw an error
    pullImageMock.mockRejectedValueOnce(new Error('Image does not exists'));

    const pullImagebutton = screen.getByRole('button', { name: 'Pull image' });
    await userEvent.click(pullImagebutton);

    // expect that the error message is displayed
    const errorMesssage = screen.getByRole('alert', { name: 'Error Message Content' });
    expect(errorMesssage).toBeInTheDocument();
    expect(errorMesssage).toHaveTextContent('Image does not exists');
  });

  // pull image with error and then pull image with success
  // error message should not be displayed anymore
  test('Expect that pull image is reporting an error only if invalid', async () => {
    setup();
    const renderResult = render(PullImage, { imageToPull: 'image-does-not-exist' });

    // first call to pull image throw an error
    pullImageMock.mockRejectedValueOnce(new Error('Image does not exists'));

    // next one are ok
    pullImageMock.mockResolvedValueOnce({});

    const pullImagebutton = screen.getByRole('button', { name: 'Pull image' });
    await userEvent.click(pullImagebutton);

    // expect that the error message is displayed
    const errorMesssage = screen.getByRole('alert', { name: 'Error Message Content' });
    expect(errorMesssage).toBeInTheDocument();
    expect(errorMesssage).toHaveTextContent('Image does not exists');

    // ok, now choose a valid image name
    renderResult.component.$$set({ imageToPull: 'some-valid-image' });

    // pull image again
    const pullImagebutton2 = screen.getByRole('button', { name: 'Pull image' });
    await userEvent.click(pullImagebutton2);

    // expect that the error message is not displayed
    expect(errorMesssage).not.toBeInTheDocument();
  });
});
