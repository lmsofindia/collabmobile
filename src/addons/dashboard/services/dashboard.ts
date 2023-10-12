// (C) Copyright 2015 Moodle Pty Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Injectable } from '@angular/core';
import { makeSingleton } from '@singletons';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ROOT_CACHE_KEY = 'addonDashboard:';

@Injectable({ providedIn: 'root' })
export class AddonDashboardProvider {

    static readonly ENTRIES_PER_PAGE = 10;
    static readonly COMPONENT = 'addondashboard';

    async isPluginEnabled(): Promise<boolean> {
        return true;
    }

}
export const AddonDashboard = makeSingleton(AddonDashboardProvider);
