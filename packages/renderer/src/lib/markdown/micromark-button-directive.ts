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

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

/**
 * Allow to generate a custom button markdown directive
 * syntax is the following:
 * :button[Name of the button]{href=http://my-link title="tooltip text"}
 */

/**
 * @this {import('micromark-util-types').CompileContext}
 * @type {import('micromark-extension-directive').Handle}
 */
export function button(d: any) {
  if (d.type !== 'textDirective') {
    return false;
  }

  // create button html if it has command attribute
  if (d.attributes && 'command' in d.attributes) {
    this.tag(
      '<button class="px-4 py-[6px] rounded-[4px] text-white text-[13px] whitespace-nowrap bg-purple-600 hover:bg-purple-500 no-underline" data-command="' +
        this.encode(d.attributes.command) +
        '">',
    );

    this.tag(
      '<i class="pf-c-button__progress" style="position: relative; margin-right:5px; display: none;"><span class="pf-c-spinner pf-m-sm" role="progressbar"><span class="pf-c-spinner__clipper">' +
        '</span><span class="pf-c-spinner__lead-ball"></span><span class="pf-c-spinner__tail-ball"></span></span></i>',
    );

    this.raw(d.label || '');
    this.tag('</button>');
  } else {
    // it is a link
    this.tag(
      '<a class="px-4 py-[6px] rounded-[4px] text-white text-[13px] whitespace-nowrap bg-purple-600 hover:bg-purple-500 no-underline"',
    );

    if (d.attributes && 'href' in d.attributes) {
      this.tag(' href="' + this.encode(d.attributes.href) + '"');
    }

    if (d.attributes && 'title' in d.attributes) {
      this.tag(' title="' + this.encode(d.attributes.title) + '"');
    }

    this.tag('>');
    this.raw(d.label || '');
    this.tag('</a>');
  }
}
