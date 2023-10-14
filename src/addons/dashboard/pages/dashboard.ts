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

    statistics: StatisticItem[] = [
        {
            title: 'Time Spent',
            value: '0 Hours',
            icon: 'fas-clock',
            color: '#0a9396',
        },
        {
            title: 'Badges',
            value: 0,
            icon: 'fas-trophy',
            color: '#00bbf9',
        },
        {
            title: 'Course Completed',
            value: 0,
            icon: 'fas-book',
            color: '#6a994e',
        },
        {
            title: 'Certificates',
            value: 0,
            icon: 'fas-certificate',
            color: '#4361ee',
        },
        {
            title: 'Programs Completed',
            value: 0,
            icon: 'fas-graduation-cap',
            color: '#bc4749',
        },
    ];

    cacheKeys = {
        statistics: ':statistics',
    };

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

        this.fetchStatistics();

        this.loaded = true;
    }

    protected async fetchStatistics(): Promise<void> {
        this.site?.read('block_user_intro_get_statistics', {
        }, this.buildPreset(this.cacheKeys.statistics)).then((data: StatisticItem[]) => {

            this.statistics = data.map((statistic) => ({
                ...statistic,
                icon: statistic.icon.replace('fa fa-', 'fas-'),
            }));

            return this.statistics;

        }).catch(() => {
            // Ignore errors.
        });
    }

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

type StatisticItem = {
    title: string;
    value: string|number;
    icon: string;
    color: string;
};
