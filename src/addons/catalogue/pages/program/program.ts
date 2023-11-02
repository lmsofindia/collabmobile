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
import { CoreNavigator } from '@services/navigator';
import { CoreSites } from '@services/sites';

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

    hasIntoVideo = false;

    program = {};

    programId = 0;

    contactsExpanded = false;

    constructor() {
        this.currentUserId = CoreSites.getCurrentSiteUserId();
        this.siteHomeId = CoreSites.getCurrentSiteHomeId();
        this.currentSite = CoreSites.getRequiredCurrentSite();
    }

    /**
     * View loaded.
     */
    async ngOnInit(): Promise<void> {
        this.programId = CoreNavigator.getRequiredRouteNumberParam('programId');

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

        await this.fetchProgram();

        this.loaded = true;
    }

    /**
     * Fetch the courses.
     *
     * @returns Promise with the entries.
     */
    protected async fetchProgram(): Promise<void> {
        return this.currentSite.read('local_course_catalogue_get_program', {
            id: this.programId,
        }).then((response: any) => {
            this.program = response;

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
