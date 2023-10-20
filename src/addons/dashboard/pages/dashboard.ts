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

import { Component, OnInit } from '@angular/core';
import { CoreSite, CoreSiteWSPreSets } from '@classes/site';
import { IonRefresher } from '@ionic/angular';
import { CoreSites } from '@services/sites';
import { AddonDashboardProvider } from '../services/dashboard';

@Component({
    selector: 'page-addon-dashboard',
    templateUrl: 'dashboard.html',
    styleUrls: ['dashboard.scss'],
})
export class AddonDashboardPage implements OnInit {

    title = '';

    protected siteHomeId: number;

    protected site: CoreSite | undefined;

    loaded = false;
    currentUserId: number;

    preSets: CoreSiteWSPreSets;

    cacheKeys = {};

    constructor() {
        this.currentUserId = CoreSites.getCurrentSiteUserId();
        this.siteHomeId = CoreSites.getCurrentSiteHomeId();
        this.site = CoreSites.getCurrentSite();
        this.preSets = {
            cacheKey: AddonDashboardProvider.ROOT_CACHE_KEY,
            updateFrequency: CoreSite.FREQUENCY_OFTEN,
            component: AddonDashboardProvider.COMPONENT,
            componentId: this.siteHomeId,
            getFromCache: true,
            saveToCache: true,
        };
    }

    /**
     * View loaded.
     */
    async ngOnInit(): Promise<void> {
        this.title = 'Dashboard';

        await this.fetchData();
    }

    /**
     * Fetch the data.
     *
     * @param refresh Empty events array first.
     * @returns Promise with the entries.
     */
    protected async fetchData(refresh: boolean = false): Promise<void> {
        if (refresh) {
            // invalidate statistics cache.
            Object.keys(this.cacheKeys).forEach((key) => {
                this.site?.invalidateWsCacheForKey(this.preSets.cacheKey + this.cacheKeys[key]);
            });
        }

        this.loaded = true;
    }

    /**
     * Build a common preset of WS options for all the requests.
     *
     * @param key Cache key to use.
     * @param frequency Update frequency.
     * @returns CoreSiteWSPreSets
     */
    protected buildPreset(key: string, frequency?: number | undefined): CoreSiteWSPreSets {
        const newKey = this.preSets.cacheKey + ':' + key;

        return {
            ...this.preSets,
            cacheKey: newKey,
            updateFrequency: frequency || this.preSets.updateFrequency,
        };
    }

    /**
     * Refresh data.
     *
     * @param refresher Refresher instance.
     */
    refresh(refresher?: IonRefresher): void {
        this.loaded = false;

        this.fetchData(true).finally(() => {
            if (refresher) {
                refresher?.complete();
            }
        });
    }

}
