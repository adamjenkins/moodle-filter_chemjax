<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Settings for the ChemJax filter.
 *
 * @package    filter_chemjax
 * @copyright  2017 Kenichi Miura (miura-k@tokyo-kasei.ac.jp)
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

if ($ADMIN->fulltree) {
    // Defaults mirror \filter_chemjax\text_filter::DEFAULT_MATHJAXURL / ::DEFAULT_BONDLEN.
    $settings->add(
        new admin_setting_configtext(
            'filter_chemjax/mathjaxurl',
            new lang_string('mathjaxurl', 'filter_chemjax'),
            new lang_string('mathjaxurl_desc', 'filter_chemjax'),
            'https://cdn.jsdelivr.net/npm/mathjax@2.7.9',
            PARAM_URL
        )
    );

    $settings->add(
        new admin_setting_configtext(
            'filter_chemjax/bondlen',
            new lang_string('bondlen', 'filter_chemjax'),
            new lang_string('bondlen_desc', 'filter_chemjax'),
            20,
            PARAM_INT,
            4
        )
    );
}
