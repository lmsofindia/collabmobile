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
import { CoreSite } from '@classes/site';
import { CoreCatalogueFiltersComponent } from '@components/catalogue-filters/catalogue-filters';
import { IonRefresher, ModalController } from '@ionic/angular';
import { CoreSites } from '@services/sites';

type Pagination = {
    page: number;
    has_next: boolean;
    has_prev: boolean;
    total: number;
    total_pages: number;
};

type Filter = {
    search: string|null;
    sort: string|null;
    rating: string|null;
    courseduration: string|null;
    coursecompliance: null|Array<string>|string;
    level: null|Array<string>|string;
    category: null|Array<string>|string;
    skill: null|Array<string>|string;
    learning_type: string;
    status: string|null;
    assignment_type: string|null;
    overdue: string|null;
    bookmarked: string|null;
};

@Component({
    selector: 'page-addon-mytrainings',
    templateUrl: 'mytrainings.html',
    styleUrls: ['mytrainings.scss'],
})
export class AddonMyTrainingsPage implements OnInit {

    protected siteHomeId: number;

    loaded = false;
    currentUserId: number;

    protected currentSite: CoreSite;

    courses: [] = [];

    programs: [] = [];

    protected pagination: Pagination = {
        page: 1,
        has_next: false,
        has_prev: false,
        total: 0,
        total_pages: 0,
    };

    filters: Filter = {
        search: null,
        sort: 'latest',
        rating: null,
        courseduration: null,
        coursecompliance: [],
        level: [],
        category: [],
        skill: [],
        learning_type: 'all',
        status: null,
        assignment_type: null,
        overdue: null,
        bookmarked: null,
    };

    appliedFiltersCount = 0;

    currentPage = 1;

    hasMoreItems = false;

    isFiltersOpen = false;

    constructor(private modalCtrl: ModalController) {
        this.currentUserId = CoreSites.getCurrentSiteUserId();
        this.siteHomeId = CoreSites.getCurrentSiteHomeId();
        this.currentSite = CoreSites.getRequiredCurrentSite();
    }

    /**
     * View loaded.
     */
    async ngOnInit(): Promise<void> {
        await this.fetchData();
    }

    /**
     * Fetch the data.
     *
     * @param refresh Empty events array first.
     * @returns Promise with the entries.
     */
    protected async fetchData(refresh: boolean = false): Promise<void> {
        this.loaded = false;

        this.setFilterCount();

        if (refresh) {
            // this.pageLoaded = 0;
        }

        await this.fetchCourses();

        this.loaded = true;
    }

    /**
     * Fetch courses.
     *
     * @returns Promise resolved when done.
     */
    protected async fetchCourses(): Promise<void> {
        const newfilters = Object.assign({}, this.filters);

        newfilters.category = newfilters.category && Array.isArray(newfilters.category) ?
            newfilters.category.join(',') : newfilters.category;
        newfilters.skill = newfilters.skill && Array.isArray(newfilters.skill) ?
            newfilters.skill.join(',') : newfilters.skill;
        newfilters.level = newfilters.level && Array.isArray(newfilters.level) ?
            newfilters.level.join(',') : newfilters.level;
        newfilters.coursecompliance = newfilters.coursecompliance && Array.isArray(newfilters.coursecompliance) ?
            newfilters.coursecompliance.join(',') : newfilters.coursecompliance;

        return this.currentSite.read('local_course_catalogue_get_my', {
            page: this.currentPage,
            filters: newfilters,
        }).then((response: {courses: []; programs: []; pagination: Pagination}) => {
            this.courses = response.courses;
            this.programs = response.programs;
            this.pagination = response.pagination;

            return;
        }).catch(() => {
            //
        });
    }

    /**
     * Load more courses.
     *
     * @param infiniteComplete Infinite scroll complete function. Only used from core-infinite-loading.
     */
    loadMoreCourses(infiniteComplete?: () => void): void {
        this.currentPage++;

        this.fetchCourses().finally(() => {
            if (infiniteComplete) {
                infiniteComplete();
            }
        });
    }

    /**
     * Search courses.
     *
     * @param event Event.
     */
    search(event: Event): void {
        event.stopPropagation();
        event.preventDefault();

        this.currentPage = 1;

        this.filters.search = (event.target as HTMLInputElement).value;

        this.fetchData(true);
    }

    async openFilters(): Promise<void> {
        const modal = await this.modalCtrl.create({
            component: CoreCatalogueFiltersComponent,
            componentProps: {
                appliedfilters: this.filters,
                filterfor: 'my',
            },
        });
        modal.present();

        const { data, role } = await modal.onWillDismiss();

        if (role === 'confirm') {
            this.filters = data;
            this.currentPage = 1;

            this.fetchData(true);
        }
    }

    protected setFilterCount(): void {
        this.appliedFiltersCount = 0;

        Object.keys(this.filters).forEach((key) => {
            if(this.filters[key] === null) {
                return;
            }

            if (key === 'search') {
                return;
            }

            if (key === 'sort' && this.filters[key] === 'latest') {
                return;
            }

            if (Array.isArray(this.filters[key])) {
                if (this.filters[key].length > 0) {
                    this.appliedFiltersCount++;
                }

                return;
            }

            if (this.filters[key] !== 'all') {
                this.appliedFiltersCount++;
            }

        });
    }

    closeFilters(): void {
        this.isFiltersOpen = false;
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
