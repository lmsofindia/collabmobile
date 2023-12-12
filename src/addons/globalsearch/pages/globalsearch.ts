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

import { Component } from '@angular/core';
import { CoreSite } from '@classes/site';
import { IonRefresher } from '@ionic/angular';
import { CoreNavigator } from '@services/navigator';
import { CoreSites } from '@services/sites';

type SearchItemTypes = 'Course' | 'Program' | 'Shorts';

type SearchItem = {
    id: number;
    image: string;
    title: string;
    type: SearchItemTypes;
    url: string;
};

@Component({
    selector: 'page-addon-globalsearch',
    templateUrl: 'globalsearch.html',
    styleUrls: ['globalsearch.scss'],
})
export class AddonGlobalSearchPage {

    title = '';

    currentSite: CoreSite;

    protected siteHomeId: number;

    loaded = true;
    currentUserId: number;

    data: SearchItem[] = [];

    searchText = '';

    constructor() {
        this.currentUserId = CoreSites.getCurrentSiteUserId();
        this.siteHomeId = CoreSites.getCurrentSiteHomeId();
        this.currentSite = CoreSites.getRequiredCurrentSite();
    }

    async search(text: string): Promise<void> {
        this.searchText = text;
        this.data = [];

        this.fetchData().finally(() => {
            this.loaded = true;
        });
    }

    /**
     * Search courses/programs/shots
     *
     * @param refresh Empty events array first.
     * @returns Promise with the entries.
     */
    protected async fetchData(refresh: boolean = false): Promise<void> {
        if(this.searchText.trim().length < 1) {
            this.data = [];
            this.loaded = true;

            return;
        }

        if (refresh) {
            // this.pageLoaded = 0;
        }

        return this.currentSite.read('local_collab_function_globalsearch', {
            search: this.searchText,
        }, {
            saveToCache: false,
        }).then((data: SearchItem[]) => {
            this.data = data;

            return;
        }).catch(() => {
            this.data = [];
        });
    }

    /**
     * Go to a course/program.
     *
     * @param id Course/program/short id.
     */
    goto(id: number|undefined, type: SearchItemTypes): void {
        switch (type) {
            case 'Course':
                CoreNavigator.navigateToSitePath(`/course/${id}/summary`);
                break;
            case 'Program':
                CoreNavigator.navigateToSitePath(`/catalogue/programs/${id}`);
                break;
            case 'Shorts':
                CoreNavigator.navigateToSitePath(`/shorts/short/${id}`);
                break;
        }
    }

    /**
     * Clear search box.
     */
    clearSearch(): void {
        this.searchText = '';
        this.data = [];

        this.loaded = false;
        this.fetchData();
    }

    /**
     * Refresh data.
     *
     * @param refresher Refresher instance.
     */
    refresh(refresher?: IonRefresher): void {
        this.loaded = false;

        this.fetchData(true).finally(() => {
            this.loaded = true;

            if (refresher) {
                refresher?.complete();
            }
        });
    }

}
