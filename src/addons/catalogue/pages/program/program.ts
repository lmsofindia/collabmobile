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
import { IonRefresher } from '@ionic/angular';
import { CoreSites } from '@services/sites';
import { Translate } from '@singletons';

@Component({
    selector: 'page-addon-program',
    templateUrl: 'program.html',
    styleUrls: ['program.scss'],
})
export class AddonProgramPage implements OnInit {

    protected siteHomeId: number;

    loaded = false;
    currentUserId: number;

    protected currentSite: CoreSite;

    title: string;

    hasIntoVideo = false;

    program = {
        id: 2,
        fullname: 'Advanced Artificial Intelligence',
        summary: 'This is program is for Artificial Intelligence. This is a 2 months program it consists of 4 courses',
        contacts: [
            {
                id: 1,
                fullname: 'Teacher 1',
            },
            {
                id: 2,
                fullname: 'Teacher 2',
            },
            {
                id: 3,
                fullname: 'Teacher 3',
            },
        ],
        meta: [
            {
                name: 'Allocation start',
                value: 'Not set',
            },
            {
                name: 'Allocation end',
                value: 'Not set',
            },
            {
                name: 'Duration',
                value: '34h 10m',
            },
            {
                name: 'Completion type',
                value: 'All in order',
            },
        ],
        image: 'https://collabera.mooconline.co.in/pluginfile.php/1/enrol_programs/image/2/pluralsight-puzzle-piece.webp.png',
        url: 'https://collabera.mooconline.co.in/enrol/programs/catalogue/program.php?id=2',
        courses: [],
    };

    contactsExpanded = false;

    constructor() {
        this.currentUserId = CoreSites.getCurrentSiteUserId();
        this.siteHomeId = CoreSites.getCurrentSiteHomeId();
        this.currentSite = CoreSites.getRequiredCurrentSite();

        this.title = Translate.instant('core.loading');
        // Learning Plan Data Mining
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

        if (refresh) {
            // this.pageLoaded = 0;
        }

        this.fetchCourses();

        this.loaded = true;
    }

    /**
     * Fetch the courses.
     *
     * @returns Promise with the entries.
     */
    protected async fetchCourses(): Promise<void> {
        return this.currentSite.read('local_course_catalogue_get_catalogue', {
            page: 1,
        }).then((response: {courses: []; programs: []; pagination: any}) => {
            this.program.courses = response.courses;

            return;
        }).catch(() => {
            //
        });
    }

    /**
     * Toggle list of contacts.
     */
    toggleContacts(): void {
        this.contactsExpanded = !this.contactsExpanded;
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
