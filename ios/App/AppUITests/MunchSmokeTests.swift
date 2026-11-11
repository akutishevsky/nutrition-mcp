import XCTest

/// IOS-SMOKE: behavioral boot/flow smoke for the packaged Munch app.
///
/// The app under test is the real Capacitor bundle built by
/// .github/workflows/mobile-ios.yml (job `smoke`) with exactly one swap:
/// scripts/ios-smoke/stub-runtime.js replaces the native-bridge module
/// inside the CI-built bundle copy, so the API answers from fixtures and
/// the "session" is a fixture flag. Every renderer, route, and page the
/// test drives is production code. No real credential or account is
/// involved; the fixture identity is smoke@munch.test.
///
/// Assertions are made against the WKWebView accessibility tree (the
/// same surface VoiceOver users get), not just screenshots: each step
/// waits for elements that only exist when that flow actually rendered,
/// and screenshots are attached per step for the run artifacts.
final class MunchSmokeTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }

    override func tearDownWithError() throws {
        app = nil
    }

    // MARK: - Journeys

    /// Cold start with no session must land on the packaged sign-in
    /// page; the fixture sign-in then boots the real shell, and Today,
    /// the log-a-meal composer, History, Pantry, and Settings all
    /// render against fixture data.
    func test01_BootSignInAndCoreFlows() throws {
        // Step 1 — cold boot renders the sign-in surfaces, not a blank
        // webview and not the signed-in shell.
        XCTAssertEqual(
            waitForBootSurface(timeout: 60),
            .signIn,
            "Cold launch did not settle on the sign-in page"
        )
        XCTAssertTrue(
            buttons(containing: "Email me a sign-in link").firstMatch.exists,
            "Magic-link submit button missing on the sign-in page"
        )
        XCTAssertTrue(
            webView.textFields.firstMatch.exists,
            "Email field missing on the sign-in page"
        )
        XCTAssertFalse(
            anyElement(containingText: "Add water").exists,
            "Signed-in shell rendered before any sign-in"
        )
        attachScreenshot("01-sign-in")

        // Step 2 — requesting a sign-in link resolves through the real
        // login page handler (fixture runtime plants the session).
        let emailField = webView.textFields.firstMatch
        emailField.tap()
        emailField.typeText("smoke@munch.test")
        tapHittable(buttons(containing: "Email me a sign-in link"), "sign-in submit")
        XCTAssertTrue(
            waitForText("Check your email", timeout: 30),
            "Sign-in page never reached its link-sent state"
        )
        attachScreenshot("02-sign-in-link-sent")

        // Step 3 — relaunch (the "opened the link on this device"
        // moment) boots the shell onto Today with fixture data.
        app.terminate()
        app.launch()
        assertTodayRendered(step: "first signed-in launch")
        attachScreenshot("03-today")

        // Step 4 — the log-a-meal path opens: Add meal presents the
        // real meal composer dialog, and Close dismisses it.
        tapHittable(
            buttons(containing: "Add meal"),
            "Add meal button"
        )
        XCTAssertTrue(
            waitForText("Find foods", timeout: 30),
            "Meal composer never opened from Today"
        )
        XCTAssertTrue(
            buttons(containing: "Log meal").firstMatch.exists,
            "Meal composer is missing its Log meal submit"
        )
        attachScreenshot("04-add-meal-composer")
        tapHittable(
            buttons(containing: "Close"),
            "composer Close button"
        )
        XCTAssertTrue(
            waitForDisappearance(ofText: "Find foods", timeout: 30),
            "Meal composer did not dismiss"
        )

        // Step 5 — History renders its (empty-fixture) meal history.
        // History has no bottom-nav slot anymore (Today-navigation
        // brief item 6): its two doors are the calendar sheet's
        // "Search history" row and the More page's History card.
        // This exercises the More door, mirroring Step 7's pattern.
        tapHittable(
            links(containing: "More"),
            "bottom-nav More link"
        )
        tapHittable(
            links(containing: "History"),
            "More page History card"
        )
        XCTAssertTrue(
            waitForText("No meals logged", timeout: 30),
            "History view never rendered its empty state"
        )
        XCTAssertTrue(
            anyElement(containingText: "Search meal history").exists,
            "History view is missing its history search"
        )
        attachScreenshot("05-history")

        // Step 6 — Pantry opens as its own packaged page and loads the
        // fixture inventory (the item count only appears after
        // pantry.js has fetched and rendered).
        tapHittable(
            links(containing: "Pantry"),
            "bottom-nav Pantry link"
        )
        XCTAssertTrue(
            waitForText("Use Pantry", timeout: 30),
            "Pantry page never rendered its shell"
        )
        XCTAssertTrue(
            waitForText("0 items", timeout: 30),
            "Pantry inventory never rendered from fixture data"
        )
        attachScreenshot("06-pantry")

        // Back to the shell via the Pantry brand link — at phone widths
        // the Pantry top-bar nav is display:none by design, so the
        // brand is the visible route home.
        tapHittable(
            links(containing: "Munch"),
            "Pantry brand link"
        )
        assertTodayRendered(step: "return from Pantry")

        // Step 7 — Settings opens through More, and the index renders
        // the fixture account identity from /api/app/settings.
        tapHittable(
            links(containing: "More"),
            "bottom-nav More link"
        )
        XCTAssertTrue(
            waitForText("Profile, billing, connections and data", timeout: 30),
            "More page never rendered its Settings card"
        )
        tapHittable(
            links(containing: "Settings"),
            "More page Settings card"
        )
        XCTAssertTrue(
            waitForText("Profile & preferences", timeout: 30),
            "Settings index never rendered"
        )
        XCTAssertTrue(
            waitForText("smoke@munch.test", timeout: 30),
            "Settings index did not render the fixture account identity"
        )
        attachScreenshot("07-settings")
    }

    /// The fixture session must survive a relaunch: sign in if needed,
    /// then prove a second cold launch goes straight to Today.
    func test02_SessionPersistsAcrossRelaunch() throws {
        signInViaFixtureIfNeeded()
        assertTodayRendered(step: "persistence check, first launch")
        app.terminate()
        app.launch()
        assertTodayRendered(step: "persistence check, relaunch")
        attachScreenshot("08-session-persists")
    }

    // MARK: - Flow helpers

    private func assertTodayRendered(step: String) {
        XCTAssertTrue(
            waitForText("Add water", timeout: 60),
            "Today never rendered its water action (\(step))"
        )
        XCTAssertTrue(
            anyElement(containingText: "Next up").exists,
            "Today is missing its Next up guidance section (\(step))"
        )
        XCTAssertTrue(
            buttons(containing: "Add meal").firstMatch.exists,
            "Today is missing its Add meal action (\(step))"
        )
        XCTAssertFalse(
            anyElement(containingText: "reach Munch").exists,
            "Today rendered the can't-reach error state (\(step))"
        )
        XCTAssertFalse(
            anyElement(containingText: "You're offline").exists,
            "Today rendered the offline state while online (\(step))"
        )
    }

    /// Which surface a cold launch settled on: a stored fixture
    /// session boots straight to Today; without one, the entry
    /// bounces to the packaged sign-in page.
    private enum BootSurface {
        case today
        case signIn
    }

    /// Poll until one of the two settled boot surfaces renders, and
    /// report which arrived first. This replaces a one-shot `exists`
    /// sample that raced the second launch's boot (run 42745339998):
    /// the sample ran before the webview had rendered, concluded
    /// "not Today", and the helper then waited 60 s for a sign-in
    /// page that could never appear — while the run's own failure
    /// hierarchy shows the app sitting on Today with "Add water"
    /// rendered. Branching on whichever ready marker arrives first
    /// removes the race deterministically; it is a correct wait, not
    /// a retry.
    ///
    /// If NEITHER surface renders within the window — the
    /// nothing-rendered signature of a stalled cold start (run
    /// 42747596417: the failure hierarchy showed a webview whose
    /// accessibility tree held only scroll bars for the full 60 s,
    /// on a process that was alive and rendered Today fine minutes
    /// later in the same run) — the app is relaunched ONCE and the
    /// wait repeated. A wedged first WebContent spin-up does not
    /// recover by waiting on the same process; a fresh launch is
    /// the deterministic remedy. This is not retry-until-green: it
    /// fires only when nothing rendered at all, and a second
    /// no-render still fails the test.
    private func waitForBootSurface(timeout: TimeInterval = 60) -> BootSurface? {
        if let surface = pollForBootSurface(timeout: timeout) {
            return surface
        }
        app.terminate()
        app.launch()
        return pollForBootSurface(timeout: timeout)
    }

    private func pollForBootSurface(timeout: TimeInterval) -> BootSurface? {
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if anyElement(containingText: "Add water").exists { return .today }
            if anyElement(containingText: "Welcome back.").exists { return .signIn }
            Thread.sleep(forTimeInterval: 0.5)
        }
        return nil
    }

    private func signInViaFixtureIfNeeded() {
        switch waitForBootSurface() {
        case .today:
            return
        case .signIn:
            break
        case nil:
            XCTFail("Neither Today nor the sign-in page rendered")
            return
        }
        let emailField = webView.textFields.firstMatch
        emailField.tap()
        emailField.typeText("smoke@munch.test")
        tapHittable(
            buttons(containing: "Email me a sign-in link"),
            "sign-in submit"
        )
        XCTAssertTrue(
            waitForText("Check your email", timeout: 30),
            "Fixture sign-in never completed"
        )
        app.terminate()
        app.launch()
    }

    // MARK: - Element helpers

    private var webView: XCUIElement {
        app.webViews.firstMatch
    }

    private func anyElement(containingText text: String) -> XCUIElement {
        webView
            .descendants(matching: .any)
            .matching(NSPredicate(format: "label CONTAINS[c] %@", text))
            .firstMatch
    }

    private func waitForText(_ text: String, timeout: TimeInterval) -> Bool {
        anyElement(containingText: text).waitForExistence(timeout: timeout)
    }

    private func waitForDisappearance(ofText text: String, timeout: TimeInterval) -> Bool {
        let element = anyElement(containingText: text)
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if !element.exists { return true }
            Thread.sleep(forTimeInterval: 0.5)
        }
        return !element.exists
    }

    /// Tap the hittable element among a query's matches. Web content can
    /// expose a same-labelled element in a navigation that is CSS-hidden
    /// at phone widths (the desktop sidebar), so this polls every match
    /// for hittability instead of trusting firstMatch or existence.
    private func tapHittable(_ query: XCUIElementQuery, _ description: String) {
        let deadline = Date().addingTimeInterval(30)
        while Date() < deadline {
            for index in 0..<query.count {
                let candidate = query.element(boundBy: index)
                if candidate.exists && candidate.isHittable {
                    candidate.tap()
                    return
                }
            }
            Thread.sleep(forTimeInterval: 0.5)
        }
        XCTFail("\(description) never became hittable")
    }

    private func buttons(containing text: String) -> XCUIElementQuery {
        webView.buttons.matching(labelPredicate(text))
    }

    private func links(containing text: String) -> XCUIElementQuery {
        webView.links.matching(labelPredicate(text))
    }

    private func labelPredicate(_ text: String) -> NSPredicate {
        NSPredicate(format: "label CONTAINS[c] %@", text)
    }

    private func attachScreenshot(_ name: String) {
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
