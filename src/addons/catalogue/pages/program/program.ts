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
import { CoreDomUtils } from '@services/utils/dom';

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

    canEnrol = true;

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
     * Enrol the user in the program.
     *
     * @returns Promise resolved when done.
     */
    async enrolConfirm(): Promise<void> {

        const enrollment: {can_enroll: boolean; enrolled: boolean; key_required: boolean } = this.program['enrollment'];

        if (!enrollment.can_enroll && !enrollment.enrolled) {
            // Can't enrol, show a modal.
            await CoreDomUtils.showErrorModal('You cannot enrol in this program.');

            return;
        }

        if (enrollment.key_required) {
            // Show a modal with the key.
            this.enterKey();

            return;
        }

        // Manual enrolment.
        // Confirm before enrolling.
        try {
            await CoreDomUtils.showConfirm('Are you sure you want to enrol in this program?', 'Enrol in program');

            this.enrol();
        } catch {
            // Cancelled enrolment.

            return;
        }
    }

    /**
     * Enrol the user in the program.
     *
     * @returns Promise resolved when done.
     */
    private async enrol(password = ''): Promise<void> {
        // Enrol the user.
        const response: {
            success: boolean; code: string; message: string;
        } = await this.currentSite.write('local_course_catalogue_program_signup', {
            programid: this.programId,
            key: password,
        });

        if (response.success) {
            this.program['enrollment'].enrolled = true;
            this.program['enrollment'].can_enroll = false;

            await CoreDomUtils.showToast('You have been enrolled in this program.');

            await this.fetchProgram();

            return;
        }

        const alert = await CoreDomUtils.showErrorModal(response.message);

        alert?.onDidDismiss().finally(() => {
            if (response.code === 'key_error') {
                // Key required, show a modal with the key.
                this.enterKey();
            }
        });
    }

    /**
     * Open enter key modal.
     *
     * @returns Promise resolved when done.
     */
    protected async enterKey(): Promise<HTMLIonAlertElement> {
        return CoreDomUtils.showAlertWithOptions({
            header: 'Enrol in program',
            message: 'Enter the enrolment key to enrol in this program',
            inputs: [
                {
                    name: 'key',
                    type: 'password',
                    placeholder: 'Enrolment key',
                },
            ],
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                },
                {
                    text: 'Enrol',
                    handler: (data: { key: string }) => {
                        if (data && data.key) {
                            this.enrol(data.key);
                        }
                    },
                },
            ],
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
