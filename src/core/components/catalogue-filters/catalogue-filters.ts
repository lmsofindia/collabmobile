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

import { Component, Input, OnInit } from '@angular/core';
import { CoreSite } from '@classes/site';
import { ModalController } from '@ionic/angular';
import { CoreSites } from '@services/sites';

const LS_FILTER = 'collab_course_catalogue_filters';

const FILTER_OPTIONS_COUNT = 15;

type FilterFor = 'catalogue' | 'my' | 'shorts';

type FilterOption = {
    label: string;
    value: string;
    isSelected: boolean;
    multilevel: boolean;
    // for multilevel
    title: string|undefined|null;
    isOpen: boolean|undefined|null;
    type: string|undefined|null;
    name: string|undefined|null;
    options: Array<{
        label: string;
        value: string;
        isSelected: boolean;
    }>|undefined|null;
};

type Filter = {
    name: string;
    title: string;
    isOpen: boolean;
    isDisabled: boolean;
    type: string;
    options: FilterOption[];
};

type SelectedFilters = {
    search: string|null;
    sort: string|null;
    rating: string|null;
    courseduration: string|null;
    coursecompliance: null|Array<string>;
    level: null|Array<string>;
    category: null|Array<string>;
    skill: null|Array<string>;
    learning_type: string;
    status: string|null;
    assignment_type: string|null;
    overdue: string|null;
    bookmarked: string|null;
};

const DEFAULT_FILTERS: SelectedFilters = {
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

@Component({
    selector: 'core-catalogue-filters',
    templateUrl: 'catalogue-filters.html',
    styleUrls: ['catalogue-filters.scss'],
})
export class CoreCatalogueFiltersComponent implements OnInit {

    @Input() filterfor: FilterFor = 'catalogue';

    @Input() appliedfilters: SelectedFilters = DEFAULT_FILTERS;

    protected site: CoreSite;

    constructor(private modalCtrl: ModalController) {
        this.site = CoreSites.getRequiredCurrentSite();
    }

    filters: Filter[] = [];

    selectedFilters: SelectedFilters = DEFAULT_FILTERS;

    selectedFilter?: Filter;

    options: FilterOption[] = [];

    filtersLoaded = false;

    searchText = '';

    cancel(): Promise<boolean> {
        return this.modalCtrl.dismiss(null, 'cancel');
    }

    confirm(): Promise<boolean> {
        return this.modalCtrl.dismiss(this.selectedFilters, 'confirm');
    }

    reset(): Promise<boolean> {
        this.selectedFilters = DEFAULT_FILTERS;
        return this.modalCtrl.dismiss(this.selectedFilters, 'confirm');
    }

    /**
     * @inheritdoc
     */
    ngOnInit(): void {
        this.selectedFilters = this.appliedfilters;

        if(this.selectedFilters.coursecompliance === null) {
            this.selectedFilters.coursecompliance = [];
        }

        if(this.selectedFilters.level === null) {
            this.selectedFilters.level = [];
        }

        if(this.selectedFilters.category === null) {
            this.selectedFilters.category = [];
        }

        if(this.selectedFilters.skill === null) {
            this.selectedFilters.skill = [];
        }

        this.getFilters();
    }

    async getFilters(): Promise<void> {
        if(this.filtersLoaded) {
            return;
        }

        // try to get filters from local storage
        const lsFilters = sessionStorage.getItem(LS_FILTER + '_' + this.filterfor);

        if(lsFilters) {
            this.processFilters(JSON.parse(lsFilters));

            return;
        }

        this.site.read('local_course_catalogue_get_filters', {
            for: this.filterfor,
        }).then((response: Filter[]) => {
            this.processFilters(response);

            return;
        }).catch(() => {
            //
        });
    }

    processFilters(response: any): void {
        // save to local storage
        sessionStorage.setItem(LS_FILTER + '_' + this.filterfor, JSON.stringify(response));

        this.filtersLoaded = true;
        this.filters = response.map((filter: Filter, index: number) => {
            filter.isOpen = index === 0;

            if(index === 0) {
                this.selectedFilter = filter;
                this.options = filter.options;
            }

            return filter;
        });
    }

    filterCount(filterName: string): number {
        if(!this.selectedFilters[filterName]) {
            return 0;
        }

        if(Array.isArray(this.selectedFilters[filterName])) {
            return this.selectedFilters[filterName].length;
        }

        return this.selectedFilters[filterName] != 'all' ? 1 : 0;
    }

    showOptions(filter: Filter): void {
        this.searchText = '';
        this.selectedFilter = filter;
        const options = JSON.parse(JSON.stringify(filter.options));

        if(!this.selectedFilter) {
            return;
        }

        // show upto FILTER_OPTIONS_COUNT options, which is sorted by isSelected
        options.sort((a: FilterOption, b: FilterOption) => {
            if(this.selectedFilter && this.selectedFilter.type == 'radio'){
                return 1;
            }

            if(this.selectedFilter
                && this.isChecked(this.selectedFilter.name, a.value)
                && !this.isChecked(this.selectedFilter.name, b.value)) {
                return -1;
            }

            if(this.selectedFilter
                && !this.isChecked(this.selectedFilter.name, a.value)
                && this.isChecked(this.selectedFilter.name, b.value)) {
                return 1;
            }

            return 0;
        });

        this.options = options.slice(0, FILTER_OPTIONS_COUNT);

        this.filters = this.filters.map((filter: Filter) => {
            filter.isOpen = this.selectedFilter?.name === filter.name;

            return filter;
        });
    }

    onCheckboxChange(event: CustomEvent, option: {label: string; value: string; isSelected: boolean}, name: string): void{
        if(event.detail.checked) {
            // push to array
            this.selectedFilters[name].push(option.value);
        } else {
            // remove from array
            this.selectedFilters[name] = this.selectedFilters[name].filter((item: string) => item !== option.value);
        }
    }

    isChecked(name: string, value: any): boolean {
        return this.selectedFilters[name].includes(value);
    }

    onSearchChange(): void {
        const search = this.searchText.trim().toLowerCase();

        let options = JSON.parse(JSON.stringify(this.selectedFilter?.options));

        if(search === '') {
            // show upto FILTER_OPTIONS_COUNT options, which is sorted by isSelected
            options.sort((a: FilterOption, b: FilterOption) => {
                if(this.selectedFilter && this.selectedFilter.type == 'radio'){
                    return 1;
                }

                if(this.selectedFilter
                    && this.isChecked(this.selectedFilter.name, a.value)
                    && !this.isChecked(this.selectedFilter.name, b.value)) {
                    return -1;
                }

                if(this.selectedFilter
                    && !this.isChecked(this.selectedFilter.name, a.value)
                    && this.isChecked(this.selectedFilter.name, b.value)) {
                    return 1;
                }

                return 0;
            });

            this.options = options.slice(0, FILTER_OPTIONS_COUNT);

            return;
        }

        // filter the options
        options = options.filter((option: FilterOption) => {
            if(option.options?.length) {
                option.options = option.options.filter(
                    (option: any) => option.label.toLowerCase().includes(search),
                ) || [];
            }

            return option.label.toLowerCase().includes(search) || option.options?.length;
        }) || [];

        // show upto 10 options
        this.options = options.slice(0, 10);
    }

}
