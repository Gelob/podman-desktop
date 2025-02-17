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
import '@testing-library/jest-dom/vitest';
import { test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import OnboardingItem from './OnboardingItem.svelte';
import type { OnboardingStepItem } from '../../../../main/src/plugin/api/onboarding';
import { ContextUI } from '../context/context';
import { configurationProperties } from '/@/stores/configurationProperties';

test('Expect button html when passing a button tag in markdown', async () => {
  const textComponent: OnboardingStepItem = {
    value: ':button[label]{command=command}',
  };
  render(OnboardingItem, {
    extension: 'extension',
    item: textComponent,
    getContext: vi.fn(),
    inProgressCommandExecution: vi.fn(),
  });
  const button = screen.getByRole('button', { name: 'label' });
  expect(button).toBeInTheDocument();
  expect(button.dataset.command).toBe('command');
});

test('Expect markdown html when passing a text component', async () => {
  const textComponent: OnboardingStepItem = {
    value: 'html content here',
  };
  render(OnboardingItem, {
    extension: 'extension',
    item: textComponent,
    getContext: vi.fn(),
    inProgressCommandExecution: vi.fn(),
  });
  const markdownSection = screen.getByLabelText('markdown-content');
  expect(markdownSection).toBeInTheDocument();
  expect(markdownSection.innerHTML.includes('html content here')).toBe(true);
});

test('Expect placeholders are replaced when passing a text component with placeholders', async () => {
  const textComponent: OnboardingStepItem = {
    value: '${onboardingContext:text}',
  };
  const context = new ContextUI();
  context.setValue('extension.onboarding.text', 'placeholder content');
  render(OnboardingItem, {
    extension: 'extension',
    item: textComponent,
    getContext: () => context,
    inProgressCommandExecution: vi.fn(),
  });
  const markdownSection = screen.getByLabelText('markdown-content');
  expect(markdownSection).toBeInTheDocument();
  expect(markdownSection.innerHTML.includes('placeholder content')).toBe(true);
});

test('Expect boolean configuration placeholder to be replaced with a checkbox', async () => {
  const textComponent: OnboardingStepItem = {
    value: '${configuration:extension.boolean.prop}',
  };
  configurationProperties.set([
    {
      parentId: '',
      title: 'record',
      description: 'record-description',
      extension: {
        id: 'extension',
      },
      hidden: false,
      id: 'extension.boolean.prop',
      type: 'boolean',
      default: false,
    },
  ]);
  render(OnboardingItem, {
    extension: 'extension',
    item: textComponent,
    getContext: vi.fn(),
    inProgressCommandExecution: vi.fn(),
  });
  const input = screen.getByLabelText('record-description');
  expect(input).toBeInTheDocument();
  expect(input instanceof HTMLInputElement).toBe(true);
  expect((input as HTMLInputElement).type).toBe('checkbox');
  expect((input as HTMLInputElement).name).toBe('extension.boolean.prop');
});

test('Expect when configuration placeholder is type string and format file to be replaced with an input button with Browse', async () => {
  const textComponent: OnboardingStepItem = {
    value: '${configuration:extension.format.prop}',
  };
  configurationProperties.set([
    {
      parentId: '',
      title: 'record',
      placeholder: 'Example: text',
      description: 'record-description',
      extension: {
        id: 'extension',
      },
      hidden: false,
      id: 'extension.format.prop',
      type: 'string',
      format: 'file',
    },
  ]);
  render(OnboardingItem, {
    extension: 'extension',
    item: textComponent,
    getContext: vi.fn(),
    inProgressCommandExecution: vi.fn(),
  });
  const readOnlyInput = screen.getByLabelText('record-description');
  expect(readOnlyInput).toBeInTheDocument();
  expect(readOnlyInput instanceof HTMLInputElement).toBe(true);
  expect((readOnlyInput as HTMLInputElement).placeholder).toBe('Example: text');
  const input = screen.getByLabelText('button-record-description');
  expect(input).toBeInTheDocument();
  expect(input.textContent).toBe('Browse ...');
});

test('Expect a type text configuration placeholder to be replaced by a text input', async () => {
  const textComponent: OnboardingStepItem = {
    value: '${configuration:extension.text.prop}',
  };
  configurationProperties.set([
    {
      parentId: '',
      title: 'record',
      placeholder: 'Example: text',
      description: 'record-description',
      extension: {
        id: 'extension',
      },
      hidden: false,
      id: 'extension.text.prop',
      type: 'string',
    },
  ]);
  render(OnboardingItem, {
    extension: 'extension',
    item: textComponent,
    getContext: vi.fn(),
    inProgressCommandExecution: vi.fn(),
  });
  const input = screen.getByLabelText('record-description');
  expect(input).toBeInTheDocument();
  expect(input instanceof HTMLInputElement).toBe(true);
  expect((input as HTMLInputElement).type).toBe('text');
  expect((input as HTMLSelectElement).name).toBe('extension.text.prop');
  expect((input as HTMLInputElement).placeholder).toBe('Example: text');
});
