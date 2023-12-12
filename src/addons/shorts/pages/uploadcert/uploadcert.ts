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
import { CoreSites } from '@services/sites';
import { CoreDomUtils } from '@services/utils/dom';

const DEFAULT_FORM_DATA = {
    name: '',
    institution_name: '',
    category: '',
    mode: '',
    issued_date: '',
    start_date: '',
    end_date: '',
    learning_hours: 0,
};

const DEFAULT_FORM_ERRORS = {
    name: '',
    institution_name: '',
    category: '',
    mode: '',
    issued_date: '',
    start_date: '',
    end_date: '',
    learning_hours: '',
    certificate: '',
};

type DropdownOption = {
    id: number|string;
    name: string;
};

@Component({
    selector: 'page-addon-certificate-upload',
    templateUrl: 'uploadcert.html',
    styleUrls: ['uploadcert.scss'],
})
export class AddonCertificateUploadPage implements OnInit {

    protected siteHomeId: number;

    loaded = false;
    currentUserId: number;

    protected currentSite: CoreSite;

    protected token: string;

    formdata = Object.assign({}, DEFAULT_FORM_DATA);

    formErrors = Object.assign({}, DEFAULT_FORM_ERRORS);

    certificate: File|null = null;

    categories: DropdownOption[] = [];

    modes: DropdownOption[] = [];

    isProcessing = false;

    allowedFileExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'svg'];

    timezone = '';
    maxdatetime = '';

    constructor() {
        this.currentUserId = CoreSites.getCurrentSiteUserId();
        this.siteHomeId = CoreSites.getCurrentSiteHomeId();
        this.currentSite = CoreSites.getRequiredCurrentSite();
        this.token = this.currentSite.getToken();

        this.timezone = this.currentSite.getStoredConfig()?.timezone || '';

        this.maxdatetime = new Date().toISOString();
    }

    onFileSelected(event: Event): void {
        const target = event.target as HTMLInputElement;
        const files = target.files as FileList;
        const file = files[0];

        // Validate file.
        if (!file) {
            this.formErrors.certificate = 'Please select a file.';

            return;
        }

        const extension = file.name.split('.').pop()?.toLowerCase();

        if(!extension || !this.allowedFileExtensions.includes(extension)) {
            this.formErrors.certificate = 'Please upload a PDF or image file.';

            return;
        }

        this.formErrors.certificate = '';

        this.certificate = file;
    }

    async ngOnInit(): Promise<void> {
        try {

            const formData = new FormData();
            formData.append('user_id', this.currentUserId.toString());
            formData.append('token', this.token);

            const request = await fetch(this.currentSite.siteUrl + '/local/external_certificate/apis/form_dropdowns.php', {
                method: 'POST',
                body: formData,
            });

            const response: {
                categories: DropdownOption[];
                modes: DropdownOption[];
            } = await request.json();

            this.categories = response.categories;

            this.modes = response.modes;

        } catch {
            CoreDomUtils.showErrorModal('Error loading data.');
        }

    }

    async upload(): Promise<void> {
        // Validate form data.
        Object.keys(this.formdata).forEach((key) => {
            // End date is optional.
            if(key === 'end_date' && this.formdata[key] === '') {
                return;
            }

            if (key === 'learning_hours') {
                if (this.formdata[key] <= 0) {
                    this.formErrors[key] = 'Please enter a valid number.';

                    return;
                }
            }

            if (this.formdata[key] === '') {
                this.formErrors[key] = 'This field is required.';

                return;
            }

            this.formErrors[key] = '';
        });

        if (this.certificate === null) {
            this.formErrors.certificate = 'Please select a file.';
        }

        if (!this.isFormValid) {
            return Promise.reject();
        }

        this.isProcessing = true;

        const formData = new FormData();
        formData.append('name', this.formdata.name);
        formData.append('institution_name', this.formdata.institution_name);
        formData.append('category', this.formdata.category.toString());
        formData.append('mode', this.formdata.mode.toString());
        formData.append('start_date', this.formdata.start_date);
        formData.append('end_date', this.formdata.end_date);
        formData.append('issued_date', this.formdata.issued_date);
        formData.append('learning_hours', this.formdata.learning_hours.toString());
        formData.append('certificate', this.certificate as Blob);
        formData.append('user_id', this.currentUserId.toString());
        formData.append('token', this.currentSite.getToken());

        try {
            const request = await fetch(this.currentSite.siteUrl + '/local/external_certificate/apis/upload.php', {
                method: 'POST',
                body: formData,
            });

            const response = await request.json();

            this.isProcessing = false;

            if (response.status && response.status === 'success') {
                this.formdata = Object.assign({}, DEFAULT_FORM_DATA);
                this.certificate = null;
                this.formErrors = Object.assign({}, DEFAULT_FORM_ERRORS);

                // reset #cert-file
                const fileInput = document.getElementById('cert-file') as HTMLInputElement;
                fileInput.value = '';

                // success alert
                CoreDomUtils.showAlert(undefined, response.message || 'Certificate uploaded successfully.');

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
            CoreDomUtils.showErrorModal('Error uploading certificate.');
        }
    }

    get isFormValid(): boolean {
        // it's ok if end date is empty.
        const formKeys = Object.keys(this.formdata).filter(key => key !== 'end_date');

        return formKeys.every(key => this.formdata[key] !== '') && this.certificate !== null;
    }

}
