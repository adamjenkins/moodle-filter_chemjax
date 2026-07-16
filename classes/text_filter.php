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

namespace filter_chemjax;

/**
 * ChemJax text filter.
 *
 * Replaces ChemJax segments — math-delimited blocks containing \cjx, and bare
 * \cjx{...} runs — with placeholder spans. The filter_chemjax/loader AMD module
 * (required from setup()) swaps each placeholder for an iframe of the plugin's
 * renderer.html, which typesets with an isolated MathJax 2 instance. Content
 * inside <pre>, <code>, <script>, <textarea> and already-processed placeholder
 * spans is left alone, matching MathJax 2's own skipTags behaviour.
 *
 * @package    filter_chemjax
 * @copyright  2017 Kenichi Miura (miura-k@tokyo-kasei.ac.jp)
 * @copyright  2026 Adam Jenkins <adam@wisecat.net>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class text_filter extends \core_filters\text_filter {
    /** @var string Default MathJax 2 base URL (mirrored in settings.php). */
    public const DEFAULT_MATHJAXURL = 'https://cdn.jsdelivr.net/npm/mathjax@2.7.9';

    /** @var int Default bond length (mirrored in settings.php). */
    public const DEFAULT_BONDLEN = 20;

    #[\Override]
    public function setup($page, $context) {
        if (!$page->requires->should_create_one_time_item_now('filter_chemjax-loader')) {
            return;
        }
        $page->requires->js_call_amd('filter_chemjax/loader', 'init', [[
            'mathjaxurl' => get_config('filter_chemjax', 'mathjaxurl') ?: self::DEFAULT_MATHJAXURL,
            'bondlen' => (int) (get_config('filter_chemjax', 'bondlen') ?: self::DEFAULT_BONDLEN),
        ]]);
    }

    #[\Override]
    public function filter($text, array $options = []) {
        if (!is_string($text) || $text === '' || strpos($text, '\\cjx') === false) {
            return $text;
        }

        // Leave <pre>/<code>/<script>/<textarea> blocks untouched. Both groups
        // always participate here (the backreference \2 needs the tag name),
        // so preg_split reliably yields [text, block, tagname, text, ...]: step by 3.
        $parts = preg_split(
            '~(<(pre|code|script|textarea)\b.*?</\2\s*>)~is',
            $text,
            -1,
            PREG_SPLIT_DELIM_CAPTURE
        );
        $result = '';
        for ($i = 0; $i < count($parts); $i += 3) {
            $result .= $this->filter_text_segment($parts[$i]);
            $result .= $parts[$i + 1] ?? '';
        }
        return $result;
    }

    /**
     * Filter a segment of HTML known not to be inside <pre>/<code>/<script>/
     * <textarea>, but which may still contain already-rendered placeholder
     * spans (e.g. from a previous filter pass) that must not be reprocessed.
     *
     * A separate single-group split is used here (rather than folding this
     * into the pre/code/script/textarea pattern above) because mixing
     * alternatives with different numbers of participating capture groups
     * makes preg_split's PREG_SPLIT_DELIM_CAPTURE output shape inconsistent.
     *
     * @param string $text HTML without pre/code/script/textarea blocks.
     * @return string
     */
    protected function filter_text_segment(string $text): string {
        if (strpos($text, '\\cjx') === false) {
            return $text;
        }

        $parts = preg_split(
            '~(<span\b[^>]*\bdata-chemjax="[^"]*"[^>]*>.*?</span>)~is',
            $text,
            -1,
            PREG_SPLIT_DELIM_CAPTURE
        );
        $result = '';
        foreach ($parts as $i => $part) {
            $result .= ($i % 2 === 0) ? $this->filter_region($part) : $part;
        }
        return $result;
    }

    /**
     * Wrap every ChemJax segment in a region of HTML in a placeholder span.
     *
     * Matching is text-level only and does not account for HTML attribute boundaries.
     * If a \cjx occurrence appears inside an HTML attribute value (e.g. title="\cjx{X}"),
     * the placeholder span will be injected inside the quoted attribute, producing broken
     * markup. This is an accepted limitation because ChemJax notation only legitimately
     * occurs in text content, not inside attribute values.
     *
     * @param string $text HTML without pre/code/script/textarea/placeholder blocks.
     * @return string
     */
    protected function filter_region(string $text): string {
        if (strpos($text, '\\cjx') === false) {
            return $text;
        }

        // Matches a ChemJax call followed by a balanced-brace argument. The
        // argument is captured as its own group with a *relative* recursion
        // (?-1): because this fragment is embedded twice below (bare, and
        // inside the run repeater), each embedded copy gets its own capturing
        // group in the compiled pattern, and (?-1) always recurses into
        // whichever of those two groups it is textually part of - unlike an
        // absolute (?1)/(?2) reference, it stays correct regardless of how
        // many times the fragment is duplicated by string concatenation.
        $cjx = '\\\\cjx(\{(?:[^{}]++|(?-1))*\})';
        // Two ChemJax calls separated by a TeX line break (a literal double
        // backslash, optionally surrounded by whitespace) count as a single
        // run and become one placeholder.
        $sep = '(?:\s*\\\\\\\\\s*)';
        $run = $cjx . '(?:' . $sep . $cjx . ')*';

        // The combined pattern matches, in order of preference: a display-math
        // segment containing a ChemJax call, an inline-math segment, a
        // bracket-delimited segment, and finally a bare (undelimited) run.
        $pattern = '~'
            . '\$\$(?:(?!\$\$).)*?\\\\cjx.*?\$\$'
            . '|\\\\\((?:(?!\\\\\)).)*?\\\\cjx.*?\\\\\)'
            . '|\\\\\[(?:(?!\\\\\]).)*?\\\\cjx.*?\\\\\]'
            . '|' . $run
            . '~s';

        return preg_replace_callback($pattern, function (array $m): string {
            $source = $m[0];
            $tex = html_entity_decode($source, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            return \html_writer::tag('span', $source, [
                'class' => 'filter-chemjax-formula',
                'data-chemjax' => base64_encode($tex),
            ]);
        }, $text);
    }
}
