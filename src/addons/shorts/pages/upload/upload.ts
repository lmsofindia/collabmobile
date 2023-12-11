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
import { CoreSkillsSelectComponent } from '@components/skills-select/skills-select';
import { ModalController } from '@ionic/angular';
import { CoreSites } from '@services/sites';
import { CoreDomUtils } from '@services/utils/dom';

const DEFAULT_FORM_DATA = {
    name: '',
    description: '',
    category: [],
    skills: [],
    issued_date: '',
    learning_hours: 0,
};

const DEFAULT_FORM_ERRORS = {
    name: '',
    description: '',
    category: '',
    skills: '',
    issued_date: '',
    learning_hours: '',
    short_video: '',
};

type DropdownOption = {
    id: number|string;
    name: string;
};

@Component({
    selector: 'page-addon-shorts-upload',
    templateUrl: 'upload.html',
    styleUrls: ['upload.scss'],
})
export class AddonShortsUploadPage implements OnInit {

    protected siteHomeId: number;

    loaded = false;
    currentUserId: number;

    protected currentSite: CoreSite;

    formdata = Object.assign({}, DEFAULT_FORM_DATA);

    formErrors = Object.assign({}, DEFAULT_FORM_ERRORS);

    short_video: File|null = null;

    categories: DropdownOption[] = [];

    skills: DropdownOption[] = [];

    selectedSkills: DropdownOption[] = [];

    skillNames = '';

    isProcessing = false;

    timezone: string;

    constructor(private modalCtrl: ModalController) {
        this.currentUserId = CoreSites.getCurrentSiteUserId();
        this.siteHomeId = CoreSites.getCurrentSiteHomeId();
        this.currentSite = CoreSites.getRequiredCurrentSite();

        this.timezone = this.currentSite.getStoredConfig()?.timezone || '';
    }

    onFileSelected(event: Event): void {
        const target = event.target as HTMLInputElement;
        const files = target.files as FileList;
        const file = files[0];

        // Validate file.
        if (file.type !== 'video/mp4') {
            this.formErrors.short_video = 'Please select a valid video file.';

            return;
        }

        this.formErrors.short_video = '';

        this.short_video = file;
    }

    async ngOnInit(): Promise<void> {
        try {
            const dropdowns: {
                categories: DropdownOption[];
                skills: DropdownOption[];
            } = await this.currentSite.read('local_short_video_get_form_dropdowns', {});

            this.categories = dropdowns.categories;

            this.skills = dropdowns.skills;

        } catch {
            CoreDomUtils.showErrorModal('Error loading data.');
        }

    }

    async upload(): Promise<void> {
        // Validate form data.
        Object.keys(this.formdata).forEach((key) => {
            if (key === 'category' || key === 'skills') {
                if (this.formdata[key].length === 0) {
                    this.formErrors[key] = 'Please select at least one option.';

                    return;
                }
            } else if (key === 'learning_hours') {
                if (this.formdata[key] <= 0) {
                    this.formErrors[key] = 'Please enter a valid number.';

                    return;
                }
            } if (this.formdata[key] === '') {
                this.formErrors[key] = 'This field is required.';

                return;
            }

            this.formErrors[key] = '';
        });

        if (this.short_video === null) {
            this.formErrors.short_video = 'Please select a file.';
        }

        if (!this.isFormValid) {
            return Promise.reject();
        }

        this.isProcessing = true;

        const formData = new FormData();
        formData.append('name', this.formdata.name);
        formData.append('description', this.formdata.description);
        formData.append('category', this.formdata.category.toString());
        formData.append('skills', this.formdata.skills.toString());
        formData.append('issued_date', this.formdata.issued_date);
        formData.append('learning_hours', this.formdata.learning_hours.toString());
        formData.append('short_video', this.short_video as Blob);
        formData.append('user_id', this.currentUserId.toString());
        formData.append('token', this.currentSite.getToken());

        try {
            const request = await fetch(this.currentSite.siteUrl + '/local/short_video/mobileupload.php', {
                method: 'POST',
                body: formData,
            });

            const response = await request.json();

            this.isProcessing = false;

            if (response.status) {
                this.formdata = Object.assign({}, DEFAULT_FORM_DATA);
                this.short_video = null;
                this.formErrors = Object.assign({}, DEFAULT_FORM_ERRORS);

                // success alert
                CoreDomUtils.showAlert(undefined, response.message || 'Short video uploaded successfully.');

                return;
            }

            if (response.errors) {
                Object.keys(this.formErrors).forEach((key) => {
                    if (response.errors[key]) {
                        this.formErrors[key] = response.errors[key];
                    }
                });

                return;
            }

            // error alert
            CoreDomUtils.showAlert(undefined, response.message);

        } catch {
            this.isProcessing = false;
            CoreDomUtils.showErrorModal('Error uploading short video.');
        }
    }

    async openSkillsSelect(): Promise<void> {
        const modal = await this.modalCtrl.create({
            component: CoreSkillsSelectComponent,
            componentProps: {
                skills: this.skills,
                selectedSkills: this.selectedSkills,
            },
        });
        modal.present();

        const { data, role } = await modal.onWillDismiss();

        if (role === 'confirm') {
            this.formdata.skills = data.map((skill: DropdownOption) => skill.id);
            this.selectedSkills = data;
            this.skillNames = data.map((skill: DropdownOption) => skill.name).join(', ');
        }
    }

    get isFormValid(): boolean {
        return Object.values(this.formErrors).every((error) => error === '');
    }

}
