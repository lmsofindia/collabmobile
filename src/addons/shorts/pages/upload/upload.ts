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

@Component({
    selector: 'page-addon-shorts-upload',
    templateUrl: 'upload.html',
    styleUrls: ['upload.scss'],
})
export class AddonShortsUploadPage {

    protected siteHomeId: number;

    loaded = false;
    currentUserId: number;

    protected currentSite: CoreSite;

    formdata = DEFAULT_FORM_DATA;

    formErrors = DEFAULT_FORM_ERRORS;

    short_video: File|null = null;

    categories = [
        {
            id: 1,
            name: 'Category 1',
        },
        {
            id: 2,
            name: 'Category 2',
        },
        {
            id: 3,
            name: 'Category 3',
        },
    ];

    skills = [
        {
            id: 1,
            name: 'Skill 1',
        },
        {
            id: 2,
            name: 'Skill 2',
        },
        {
            id: 3,
            name: 'Skill 3',
        },
    ];

    constructor() {
        this.currentUserId = CoreSites.getCurrentSiteUserId();
        this.siteHomeId = CoreSites.getCurrentSiteHomeId();
        this.currentSite = CoreSites.getRequiredCurrentSite();
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

        const formData = new FormData();
        formData.append('name', this.formdata.name);
        formData.append('description', this.formdata.description);
        formData.append('category', this.formdata.category.toString());
        formData.append('skills', this.formdata.skills.toString());
        formData.append('issued_date', this.formdata.issued_date);
        formData.append('learning_hours', this.formdata.learning_hours.toString());
        formData.append('short_video', this.short_video as Blob);

        return this.currentSite.write('local_short_video_upload', formData)
            .then((response: any) => {
                if (response.status) {
                    this.formdata = DEFAULT_FORM_DATA;
                    this.short_video = null;
                    this.formErrors = DEFAULT_FORM_ERRORS;

                    // success alert
                    CoreDomUtils.showAlert(undefined, response.message);

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

                return;
            }).catch((error) => {
                CoreDomUtils.showErrorModalDefault(error, 'Error uploading video.');
            });
    }

    get isFormValid(): boolean {
        return Object.values(this.formErrors).every((error) => error === '');
    }

}
