@filter @filter_chemjax @javascript
Feature: ChemJax formulas are rendered on course pages
  In order to show chemical structural formulas
  As a teacher
  I need content containing \cjx notation to be rendered by the ChemJax filter

  Background:
    Given the following "courses" exist:
      | fullname | shortname | format |
      | ChemJax  | CJ101     | topics |
    And the following "activities" exist:
      | activity | course | idnumber | name        | intro                        |
      | label    | CJ101  | l1       | ChemJax lab | <p>$$\cjx{CH_3 -CH_3}$$</p> |
    And the "chemjax" filter is "on"

  Scenario: A \cjx formula becomes a renderer iframe
    When I log in as "admin"
    And I am on "ChemJax" course homepage
    # Rendering happens client-side after loader.js swaps the placeholder for an
    # iframe and the renderer.html page finishes loading MathJax 2 from the CDN
    # and typesetting. Cold-cache CDN fetches have been observed to take
    # ~13-14s in this environment (app-level timeout is 20s), which exceeds the
    # core "I wait until ... exists" step's default extended timeout (10s, see
    # behat_session_trait::get_extended_timeout()). So we wait out the
    # renderer's own worst-case budget explicitly before asserting, rather than
    # relying on that step's shorter built-in spin.
    And I wait "20" seconds
    Then "//iframe[contains(@class, 'filter-chemjax-frame')]" "xpath_element" should exist

  Scenario: The filter leaves a readable fallback when disabled
    Given the "chemjax" filter is "off"
    When I log in as "admin"
    And I am on "ChemJax" course homepage
    Then "//iframe[contains(@class, 'filter-chemjax-frame')]" "xpath_element" should not exist
