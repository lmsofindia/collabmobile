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

type DropdownOption = {
    id: number|string;
    name: string;
};

@Component({
    selector: 'core-skills-select',
    templateUrl: 'skills-select.html',
    styleUrls: ['skills-select.scss'],
})
export class CoreSkillsSelectComponent implements OnInit {

    @Input() skills: DropdownOption[] = [];

    @Input() selectedSkills: DropdownOption[] = [];

    protected site: CoreSite;

    constructor(private modalCtrl: ModalController) {
        this.site = CoreSites.getRequiredCurrentSite();
    }

    selected: DropdownOption[] = [];

    options: DropdownOption[] = [];

    searchText = '';

    cancel(): Promise<boolean> {
        return this.modalCtrl.dismiss(null, 'cancel');
    }

    confirm(): Promise<boolean> {
        return this.modalCtrl.dismiss(this.selected, 'confirm');
    }

    /**
     * @inheritdoc
     */
    ngOnInit(): void {
        this.selected = this.selectedSkills;

        this.setDefault();
    }

    setDefault(): void {
        if(this.selected.length > 0) {
            this.options = Object.assign([], this.selected);

            // check if the options are less than 10
            if(this.options.length < 10) {
                this.options = this.options.concat(
                    this.skills.filter(
                        (option: DropdownOption) => !this.selected.some((item: DropdownOption) => item.id === option.id),
                    ).slice(0, 10 - this.options.length),
                );
            }

            return;
        }

        this.options = Object.assign([], this.skills.slice(0, 10));
    }

    onCheckboxChange(event: CustomEvent, option: DropdownOption): void{
        if(event.detail.checked) {
            // push to array
            this.selected.push(option);
        } else {
            // remove from array
            this.selected = this.selected.filter((item: DropdownOption) => item.id !== option.id);
        }
    }

    isChecked(option: DropdownOption): boolean {
        return this.selected.some((item: DropdownOption) => item.id === option.id);
    }

    onSearchChange(): void {
        const search = this.searchText.trim().toLowerCase();

        const allOptions = JSON.parse(JSON.stringify(this.skills));

        if(search === '') {
            this.options = allOptions.slice(0, 10);

            return;
        }

        // filter the options
        this.options = allOptions.filter((option: DropdownOption) => option.name.toLowerCase().includes(search)).slice(0, 10);
    }

}
