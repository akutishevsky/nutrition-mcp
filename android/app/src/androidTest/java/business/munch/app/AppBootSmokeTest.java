package business.munch.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import androidx.test.ext.junit.rules.ActivityScenarioRule;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * S0 boot smoke test (Full Parity App Program): the packaged app must
 * actually cold-start on a device — MainActivity resumes, the Capacitor
 * WebView is created, and the packaged .mobile-web bundle loads from the
 * app-local origin and renders a Munch document (the app shell or, with
 * no stored session, the packaged sign-in page).
 *
 * This replaces the stock Capacitor template ExampleInstrumentedTest,
 * which asserted a template package name and never launched the app.
 */
@RunWith(AndroidJUnit4.class)
public class AppBootSmokeTest {

    @Rule
    public ActivityScenarioRule<MainActivity> activityRule =
            new ActivityScenarioRule<>(MainActivity.class);

    private static WebView findWebView(View view) {
        if (view instanceof WebView) {
            return (WebView) view;
        }
        if (view instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) view;
            for (int i = 0; i < group.getChildCount(); i++) {
                WebView found = findWebView(group.getChildAt(i));
                if (found != null) {
                    return found;
                }
            }
        }
        return null;
    }

    @Test
    public void coldStartBootsPackagedShell() throws Exception {
        assertEquals(
                "business.munch.app",
                InstrumentationRegistry.getInstrumentation()
                        .getTargetContext()
                        .getPackageName());

        AtomicReference<WebView> webViewRef = new AtomicReference<>();
        activityRule
                .getScenario()
                .onActivity(
                        activity -> {
                            assertNotNull(activity);
                            webViewRef.set(
                                    findWebView(
                                            activity.getWindow().getDecorView()));
                        });
        assertNotNull(
                "Capacitor WebView must exist after cold start", webViewRef.get());

        // Poll until the packaged bundle renders a Munch document. The
        // entry page restores the installed-app route and, without a
        // stored session, lands on the packaged sign-in page — both are
        // Munch documents served from the app-local (localhost) origin.
        AtomicReference<String> urlRef = new AtomicReference<>();
        AtomicReference<String> titleRef = new AtomicReference<>();
        long deadlineMs = System.currentTimeMillis() + 30_000;
        while (System.currentTimeMillis() < deadlineMs) {
            activityRule
                    .getScenario()
                    .onActivity(
                            activity -> {
                                WebView webView =
                                        findWebView(
                                                activity.getWindow()
                                                        .getDecorView());
                                if (webView == null) {
                                    return;
                                }
                                urlRef.set(webView.getUrl());
                                webView.evaluateJavascript(
                                        "document.title",
                                        value -> {
                                            if (value != null) {
                                                titleRef.set(
                                                        value.replaceAll(
                                                                "^\"|\"$", ""));
                                            }
                                        });
                            });
            String url = urlRef.get();
            String title = titleRef.get();
            if (url != null
                    && url.contains("localhost")
                    && title != null
                    && title.contains("Munch")) {
                break;
            }
            Thread.sleep(250);
        }

        String url = urlRef.get();
        String title = titleRef.get();
        assertTrue(
                "Packaged bundle must load from the app-local origin, got: " + url,
                url != null && url.contains("localhost"));
        assertTrue(
                "Packaged shell must render a Munch document, got title: " + title,
                title != null && title.contains("Munch"));
    }
}
