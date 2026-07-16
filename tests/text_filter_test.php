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
 * Unit tests for the ChemJax text filter.
 *
 * @package    filter_chemjax
 * @category   test
 * @copyright  2026 (current maintainer)
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers \filter_chemjax\text_filter
 */
final class text_filter_test extends \advanced_testcase {
    /**
     * Run the ChemJax filter over a snippet of HTML.
     *
     * @param string $html
     * @return string
     */
    protected function filter(string $html): string {
        $filter = new \filter_chemjax\text_filter(\context_system::instance(), []);
        return $filter->filter($html);
    }

    public function test_text_without_cjx_is_untouched(): void {
        $html = '<p>Water is H2O and $$x^2 + y^2$$ stays MathJax-4 business.</p>';
        $this->assertSame($html, $this->filter($html));
    }

    public function test_display_math_segment_is_wrapped(): void {
        $out = $this->filter('<p>$$\cjx{CH_3 -CH_3}$$</p>');
        $this->assertStringContainsString('class="filter-chemjax-formula"', $out);
        $this->assertStringContainsString('data-chemjax="' . base64_encode('$$\cjx{CH_3 -CH_3}$$') . '"', $out);
        $this->assertStringContainsString('>$$\cjx{CH_3 -CH_3}$$</span>', $out); // Fallback text kept.
    }

    public function test_inline_and_bracket_delimiters(): void {
        $out = $this->filter('\(\cjx{OH}\) and \[\cjx{NH_2}\]');
        $this->assertSame(2, substr_count($out, 'filter-chemjax-formula'));
    }

    public function test_bare_cjx_with_nested_braces(): void {
        $src = '\cjx{CH_3 -CH (#[2]CH_3) -\phantom{X}}';
        $out = $this->filter("<p>$src</p>");
        $this->assertStringContainsString('data-chemjax="' . base64_encode($src) . '"', $out);
    }

    public function test_backslash_separated_run_is_one_placeholder(): void {
        $out = $this->filter('<p>\cjx{CH3 -CH} \\\\ \cjx{-CH_2 -OH}</p>');
        $this->assertSame(1, substr_count($out, 'filter-chemjax-formula'));
    }

    public function test_pre_and_code_blocks_are_skipped(): void {
        $html = '<pre>\cjx{CH_3}</pre><code>$$\cjx{X}$$</code>';
        $this->assertSame($html, $this->filter($html));
    }

    public function test_entities_are_decoded_in_payload(): void {
        $out = $this->filter('$$\cjx{a &lt; b}$$');
        $this->assertStringContainsString('data-chemjax="' . base64_encode('$$\cjx{a < b}$$') . '"', $out);
    }

    public function test_ordinary_math_next_to_chemjax_is_untouched(): void {
        $out = $this->filter('<p>$$e=mc^2$$ then $$\cjx{CH_4}$$</p>');
        $this->assertStringContainsString('$$e=mc^2$$ then <span', $out);
        $this->assertSame(1, substr_count($out, 'filter-chemjax-formula'));
    }

    public function test_nested_braces_depth_two(): void {
        $src = '\cjx{A{B{C}D}E}';
        $out = $this->filter("<p>$src</p>");
        $this->assertStringContainsString('data-chemjax="' . base64_encode($src) . '"', $out);
    }

    public function test_cjx_at_string_start_and_end(): void {
        $src = '\cjx{H_2O}';
        $out = $this->filter($src);
        $this->assertStringContainsString('data-chemjax="' . base64_encode($src) . '"', $out);
        $this->assertSame(1, substr_count($out, 'filter-chemjax-formula'));
    }

    public function test_script_and_textarea_blocks_are_skipped(): void {
        $html = '<script>\cjx{X}</script><textarea>$$\cjx{Y}$$</textarea>';
        $this->assertSame($html, $this->filter($html));
    }

    public function test_placeholder_is_not_reprocessed_on_second_pass(): void {
        $once = $this->filter('<p>$$\cjx{CH_4}$$</p>');
        $twice = $this->filter($once);
        $this->assertSame($once, $twice);
        $this->assertSame(1, substr_count($twice, 'filter-chemjax-formula'));
    }

    public function test_multiple_segments_in_one_text(): void {
        $out = $this->filter('<p>$$\cjx{A}$$ text \(\cjx{B}\) more \cjx{C}</p>');
        $this->assertSame(3, substr_count($out, 'filter-chemjax-formula'));
    }
}
