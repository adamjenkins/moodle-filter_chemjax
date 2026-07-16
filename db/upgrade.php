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
 * ChemJax filter upgrade steps.
 *
 * @package    filter_chemjax
 * @copyright  2017 Kenichi Miura (miura-k@tokyo-kasei.ac.jp)
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Upgrade steps. The 2.0.0 rewrite keeps the bondlen setting; nothing to migrate.
 *
 * @param int $oldversion the version we are upgrading from
 * @return bool
 */
function xmldb_filter_chemjax_upgrade(int $oldversion): bool {
    return true;
}
