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

import * as path from 'node:path';
import * as sudo from 'sudo-prompt';
import * as os from 'node:os';
import * as fs from 'node:fs';
import * as extensionApi from '@podman-desktop/api';

export interface RunOptions {
  env?: NodeJS.ProcessEnv;
  logger?: extensionApi.Logger;
}

const localBinDir = '/usr/local/bin';

// Takes a binary path (e.g. /tmp/docker-compose) and installs it to the system. Renames it based on binaryName
// supports Windows, Linux and macOS
// If using Windows or Mac, we will use sudo-prompt in order to elevate the privileges
// If using Linux, we'll use pkexec and polkit support to ask for privileges.
// When running in a flatpak, we'll use flatpak-spawn to execute the command on the host
export async function installBinaryToSystem(binaryPath: string, binaryName: string): Promise<void> {
  const system = process.platform;

  // Before copying the file, make sure it's executable (chmod +x) for Linux and Mac
  if (system === 'linux' || system === 'darwin') {
    try {
      await extensionApi.process.exec('chmod', ['+x', binaryPath]);
      console.log(`Made ${binaryPath} executable`);
    } catch (error) {
      throw new Error(`Error making binary executable: ${error}`);
    }
  }

  // Create the appropriate destination path (Windows uses AppData/Local, Linux and Mac use /usr/local/bin)
  // and the appropriate command to move the binary to the destination path
  let destinationPath: string;
  let command: string[];
  if (system === 'win32') {
    destinationPath = path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'WindowsApps', `${binaryName}.exe`);
    command = ['copy', `"${binaryPath}"`, `"${destinationPath}"`];
  } else {
    destinationPath = path.join(localBinDir, binaryName);
    command = ['cp', binaryPath, destinationPath];
  }

  // If on macOS or Linux, check to see if the /usr/local/bin directory exists,
  // if it does not, then add mkdir -p /usr/local/bin to the start of the command when moving the binary.
  if ((system === 'linux' || system === 'darwin') && !fs.existsSync(localBinDir)) {
    command.unshift('mkdir', '-p', localBinDir, '&&');
  }

  // If windows or mac, use sudo-prompt to elevate the privileges
  // if Linux, use sudo and polkit support
  if (system === 'win32' || system === 'darwin') {
    return new Promise<void>((resolve, reject) => {
      // Convert the command array to a string for sudo prompt
      // the name is used for the prompt
      const sudoOptions = {
        name: 'Binary Installation',
      };
      const sudoCommand = command.join(' ');
      sudo.exec(sudoCommand, sudoOptions, error => {
        if (error) {
          console.error(`Failed to install '${binaryName}' binary: ${error}`);
          reject(error);
        } else {
          console.log(`Successfully installed '${binaryName}' binary.`);
          resolve();
        }
      });
    });
  } else {
    try {
      // Use pkexec in order to elevate the prileges / ask for password for copying to /usr/local/bin
      await extensionApi.process.exec('pkexec', command);
      console.log(`Successfully installed '${binaryName}' binary.`);
    } catch (error) {
      console.error(`Failed to install '${binaryName}' binary: ${error}`);
      throw error;
    }
  }
}
