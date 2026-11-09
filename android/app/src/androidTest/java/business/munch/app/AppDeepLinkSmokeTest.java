package business.munch.app;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.content.Intent;
import android.net.Uri;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * S4 deep-link smoke test (Full Parity App Program): a munch://app
 * deep link cold-starting the packaged app must route through the
 * /app allowlist. With no stored session the shell lands on the
 * packaged sign-in page carrying the deep-linked route as its
 * return_to, so sign-in continues to /app/recipes — the link is
 * neither dropped nor opened externally.
 */
@RunWith(AndroidJUnit4.class)
public class AppDeepLinkSmokeTest {

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

    private static String decode(String value) {
        try {
            return URLDecoder.decode(value, StandardCharsets.UTF_8.name());
        } catch (UnsupportedEncodingException error) {
            return value;
        }
    }

    @Test
    public void deepLinkLandsOnAllowlistedRoute() throws Exception {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("munch://app/recipes"));
        intent.setClassName("business.munch.app", "business.munch.app.MainActivity");

        AtomicReference<String> urlRef = new AtomicReference<>();
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(intent)) {
            long deadlineMs = System.currentTimeMillis() + 30_000;
            while (System.currentTimeMillis() < deadlineMs) {
                scenario.onActivity(
                        activity -> {
                            WebView webView =
                                    findWebView(activity.getWindow().getDecorView());
                            if (webView != null) {
                                urlRef.set(webView.getUrl());
                            }
                        });
                String url = urlRef.get();
                if (url != null
                        && url.contains("mobile-login.html")
                        && decode(url).contains("/app/recipes")) {
                    break;
                }
                Thread.sleep(250);
            }
        }

        String url = urlRef.get();
        assertNotNull("WebView must load a document for a deep link", url);
        assertTrue(
                "Deep link must land on the packaged sign-in page, got: " + url,
                url.contains("mobile-login.html"));
        assertTrue(
                "Deep link route must survive as the sign-in return route, got: " + url,
                decode(url).contains("/app/recipes"));
    }
}
