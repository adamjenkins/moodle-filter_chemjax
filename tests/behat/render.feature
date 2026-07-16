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
    # loader.js swaps the placeholder span for an iframe near-instantly, well
    # before MathJax has actually rendered anything, so an iframe-exists check
    # alone can pass vacuously even if rendering never completes. The loader
    # only adds the "filter-chemjax-rendered" class to the (still-present)
    # placeholder span once the renderer.html iframe posts back a height
    # message, i.e. once MathJax 2 has actually typeset the formula. That is
    # the real completion signal, so we assert it, not mere iframe existence.
    #
    # Cold-cache CDN fetches of MathJax have been observed to take ~13-14s in
    # this environment (loader.js's own give-up timeout is 20s), which exceeds
    # the core "I wait until ... exists" step's default extended timeout (10s,
    # see behat_session_trait::get_extended_timeout()). So we wait out most of
    # that worst-case budget with a fixed pre-wait first, then assert the
    # completion marker: the scenario fails outright if MathJax never finishes.
    And I wait "15" seconds
    Then "//span[contains(@class, 'filter-chemjax-rendered')]" "xpath_element" should exist
    And "//iframe[contains(@class, 'filter-chemjax-frame')]" "xpath_element" should exist

  Scenario: The filter leaves a readable fallback when disabled
    Given the "chemjax" filter is "off"
    # The site also has the core MathJax filter active for other content; it
    # scans the DOM client-side and would otherwise typeset our raw "$$...$$"
    # source itself (client-side, independently of chemjax), removing the very
    # literal text this scenario needs to assert on. Disable it here so the
    # assertion below is about chemjax's own fallback, not a race against an
    # unrelated filter.
    And the "mathjaxloader" filter is "off"
    When I log in as "admin"
    And I am on "ChemJax" course homepage
    Then "//iframe[contains(@class, 'filter-chemjax-frame')]" "xpath_element" should not exist
    # With the filter off, the raw "$$\cjx{...}$$" source is left as visible
    # text rather than being enhanced, so it must actually be readable, not
    # merely absent-of-iframe.
    And I should see "cjx{CH_3 -CH_3}"
