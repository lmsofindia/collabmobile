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
import { IonRefresher } from '@ionic/angular';
import { CoreSites } from '@services/sites';

@Component({
    selector: 'page-addon-dashboard',
    templateUrl: 'dashboard.html',
    styleUrls: ['dashboard.scss'],
})
export class AddonDashboardPage implements OnInit {

    title = '';

    protected siteHomeId: number;

    loaded = false;
    currentUserId: number;

    statistics: StatisticItem[] = [
        {
            title: 'Time Spent',
            value: '0 Hours',
            icon: 'time',
            color: '#0a9396',
        },
        {
            title: 'Badges',
            value: 0,
            icon: 'trophy',
            color: '#00bbf9',
        },
        {
            title: 'Course Completed',
            value: 0,
            icon: 'checkmark-circle',
            color: '#6a994e',
        },
        {
            title: 'Certificates',
            value: 0,
            icon: 'document-text',
            color: '#4361ee',
        },
        {
            title: 'Programs Completed',
            value: 0,
            icon: 'ribbon',
            color: '#bc4749',
        },
    ];

    constructor() {
        this.currentUserId = CoreSites.getCurrentSiteUserId();
        this.siteHomeId = CoreSites.getCurrentSiteHomeId();
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
            // this.pageLoaded = 0;
        }

        this.loaded = true;
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
