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
import { CoreUser, CoreUserProfile } from '@features/user/services/user';

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
            id: 'badges',
            title: 'Badges',
            value: 0,
            icon: 'fas-trophy',
            color: '#00bbf9',
        },
        {
            id: 'coursecompleted',
            title: 'Course Completed',
            value: 0,
            icon: 'fas-book',
            color: '#6a994e',
        },
        {
            id: 'certificates',
            title: 'Certificates',
            value: 0,
            icon: 'fas-certificate',
            color: '#4361ee',
        },
        {
            id: 'programscompleted',
            title: 'Programs Completed',
            value: 0,
            icon: 'fas-graduation-cap',
            color: '#bc4749',
        },
    ];

    cacheKeys = {
        statistics: ':statistics',
        matrixBoxes: ':matrixBoxes',
    };

    myCourses: [] = [];

    recommendedCourses: [] = [];

    matrixBoxes: MatrixBoxes[] = [
        {
            title: 'To do',
            value: '0 Courses',
            percentage: '0%',
            percentage_int: 0,
            color: '#0072BC',
        },
        {
            title: 'Overdue',
            value: '0 Courses',
            percentage: '0%',
            percentage_int: 0,
            color: '#E74C31',
        },
        {
            title: 'Completed',
            value: '0 Courses',
            percentage: '0%',
            percentage_int: 0,
            color: '#17C167',
        },
    ];

    timeSpent = '0 hours';

    user?: CoreUserProfile;

    thisMonthYear = new Date().toLocaleString('en-us', { month: 'long', year: 'numeric' });

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

        try {
            this.user = await CoreUser.getProfile(this.currentUserId);
        } catch {
            this.user = {
                id: this.currentUserId,
                fullname: 'User',
            };
        }

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

        await this.fetchStatistics();

        await this.fetchMatrixBoxes();

        await this.fetchMyCourses();

        await this.fetchRecommendedCourses();

        this.loaded = true;
    }

    /**
     * Fetch the statistics.
     *
     * @returns Promise resolved when done.
     */
    protected async fetchStatistics(): Promise<void> {
        this.site?.read('block_user_intro_get_statistics', {
        }, this.buildPreset(this.cacheKeys.statistics)).then((data: StatisticItem[]) => {

            let statistics = data.map((statistic) => ({
                ...statistic,
                icon: statistic.icon.replace('fa fa-', 'fas-'),
            }));

            // get time spent.
            this.timeSpent = statistics.find((statistic) => statistic.id === 'timespent')?.value as string;

            // popout time spent.
            statistics = statistics.filter((statistic) => statistic.id !== 'timespent');

            this.statistics = statistics;

            return this.statistics;

        }).catch(() => {
            // Ignore errors.
        });
    }

    /**
     * Fetch the matrix boxes.
     *
     * @returns Promise resolved when done.
     */
    protected async fetchMatrixBoxes(): Promise<void> {
        this.site?.read('block_user_intro_get_trainingmatrices', {
        }, this.buildPreset(this.cacheKeys.matrixBoxes)).then((data: MatrixBoxes[] ) => {
            this.matrixBoxes = data || [];

            return;
        }).catch(() => {
            this.matrixBoxes = [];
        });
    }

    /**
     * Fetch the my courses.
     *
     * @returns Promise resolved when done.
     */
    protected async fetchMyCourses(): Promise<void> {
        this.site?.read('local_course_catalogue_get_my', {
            filters: {
                learning_type : 'course',
            },
            page: 1,
            per_page: 12,
        }).then((data: CatalogueResponse) => {
            this.myCourses = data.courses || [];

            return;
        }).catch(() => {
            this.myCourses = [];
        });
    }

    /**
     * Fetch the recommended courses.
     *
     * @returns Promise resolved when done.
     */
    protected async fetchRecommendedCourses(): Promise<void> {
        this.site?.read('local_course_catalogue_get_recommended_courses', {})
            .then((data: { courses: [] }) => {
                this.recommendedCourses = data.courses || [];

                return;
            }).catch(() => {
                this.recommendedCourses = [];
            });
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

type StatisticItem = {
    id: string;
    title: string;
    value: string|number;
    icon: string;
    color: string;
};

type CatalogueResponse = {
    courses: [];
    programs: [];
    pagination: {
        page: number;
        has_next: boolean;
        has_prev: boolean;
        total: number;
        total_pages: number;
    };
};

type MatrixBoxes = {
    title: string;
    value: string|number;
    percentage: string|number;
    percentage_int: number;
    color: string;
};
