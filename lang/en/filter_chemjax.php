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
 * Strings for component 'filter_chemjax', language 'en'.
 *
 * @package    filter_chemjax
 * @copyright  2017 Kenichi Miura (miura-k@tokyo-kasei.ac.jp)
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['bondlen'] = 'Length of bonds';
$string['bondlen_desc'] = 'Default bond length used when drawing structural formulas (arbitrary xy-pic units, default 20).';
$string['filtername'] = 'ChemJax';
$string['mathjaxurl'] = 'MathJax 2 URL';
$string['mathjaxurl_desc'] = 'Base URL of a MathJax 2.7.x installation used by the isolated ChemJax renderer (the site\'s own MathJax filter is not affected). Point this at a local copy to avoid the CDN.';
$string['privacy:metadata'] = 'The ChemJax filter does not store any personal data.';
$string['rendererfailed'] = 'The ChemJax renderer could not be loaded; showing the formula source instead.';
