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
 * ChemJax filter post-install hook.
 *
 * @package    filter_chemjax
 * @copyright  2017 Kenichi Miura (miura-k@tokyo-kasei.ac.jp)
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Enable the filter globally on install, matching the 1.x behaviour.
 */
function xmldb_filter_chemjax_install(): void {
    global $CFG;
    require_once("$CFG->libdir/filterlib.php");
    filter_set_global_state('chemjax', TEXTFILTER_ON, 0);
}
