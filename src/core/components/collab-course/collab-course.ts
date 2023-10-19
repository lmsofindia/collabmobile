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

import { Component, Input } from '@angular/core';
import { CoreSite } from '@classes/site';
import { CoreCourseHelper } from '@features/course/services/course-helper';
import { CoreNavigator } from '@services/navigator';
import { CoreSites } from '@services/sites';
import { CoreDomUtils } from '@services/utils/dom';

@Component({
    selector: 'core-collab-course',
    templateUrl: 'collab-course.html',
    styleUrls: ['collab-course.scss'],
})
export class CoreCollabCourseComponent {

    @Input() course = {};

    @Input() viewmode: ViewMode = 'card';

    bookmarkBtnDisabled = false;

    protected site: CoreSite;

    constructor() {
        this.site = CoreSites.getRequiredCurrentSite();
    }

    /**
     * Toggle course bookmark.
     */
    toggleBookmark(event: Event): void {
        event.stopPropagation();
        event.preventDefault();

        this.bookmarkBtnDisabled = true;

        this.site.read('local_course_catalogue_toggle_bookmark', {
            courseid: this.course['id'],
        }, {
            updateFrequency: CoreSite.FREQUENCY_USUALLY,
            getFromCache: false,
            saveToCache: false,
        }).then((data: {success: boolean; bookmarked: boolean; message: string }) => {
            if(data['success']) {
                this.course['bookmarked'] = data['bookmarked'];
                this.bookmarkBtnDisabled = false;

                CoreDomUtils.showAlert(undefined, data['message']);
            }

            return;
        }).catch(() => {
            // do nothing
            this.bookmarkBtnDisabled = false;
            CoreDomUtils.showErrorModal('Error while bookmarking course');

            return;
        });
    }

    goToCourse(): void {
        if (this.course['progress'] === undefined || this.course['progress'] === -1 || this.course['progress'] === null) {
            CoreNavigator.navigateToSitePath(`/course/${this.course['id']}/summary`);
        } else {
            CoreCourseHelper.openCourse({ id: this.course['id'] });
        }
    }

    getTeacherName(): string {
        if (this.course['teachers'] && this.course['teachers'].length > 0) {
            return this.course['teachers'][0]['fullname'];
        }

        return '';
    }

}

type ViewMode = 'card' | 'list';

// type Course = {
// };
