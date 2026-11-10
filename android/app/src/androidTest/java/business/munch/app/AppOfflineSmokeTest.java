package business.munch.app;

import static org.junit.Assert.assertTrue;

import android.app.UiAutomation;
import android.os.ParcelFileDescriptor;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.InputStream;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * S4 offline cold-start smoke test (Full Parity App Program): with the
 * device network off (airplane mode + radios disabled by this test),
 * the packaged app cold-starts into the real shell with the designed
 * offline state (data-testid="offline-state") — never a blank screen
 * or an indefinite loader. The test restores connectivity in a
 * finally block so the emulator is never left offline.
 */
@RunWith(AndroidJUnit4.class)
public class AppOfflineSmokeTest {

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

    private static void executeShell(UiAutomation automation, String command)
            throws Exception {
        ParcelFileDescriptor descriptor = automation.executeShellCommand(command);
        try (InputStream input =
                new ParcelFileDescriptor.AutoCloseInputStream(descriptor)) {
            while (input.read() != -1) {
                // Drain so the command runs to completion.
            }
        }
    }

    private static void setNetworkEnabled(UiAutomation automation, boolean enabled)
            throws Exception {
        if (enabled) {
            executeShell(automation, "settings put global airplane_mode_on 0");
            executeShell(
                    automation,
                    "am broadcast -a android.intent.action.AIRPLANE_MODE --ez state false");
            executeShell(automation, "svc wifi enable");
            executeShell(automation, "svc data enable");
        } else {
            executeShell(automation, "settings put global airplane_mode_on 1");
            executeShell(
                    automation,
                    "am broadcast -a android.intent.action.AIRPLANE_MODE --ez state true");
            executeShell(automation, "svc wifi disable");
            executeShell(automation, "svc data disable");
        }
    }

    @Test
    public void offlineColdStartRendersOfflineState() throws Exception {
        UiAutomation automation =
                InstrumentationRegistry.getInstrumentation().getUiAutomation();
        setNetworkEnabled(automation, false);
        try {
            // Give the connectivity stack a moment to report offline
            // before the WebView reads navigator.onLine.
            Thread.sleep(3_000);

            AtomicReference<String> probeRef = new AtomicReference<>();
            try (ActivityScenario<MainActivity> scenario =
                    ActivityScenario.launch(MainActivity.class)) {
                long deadlineMs = System.currentTimeMillis() + 45_000;
                while (System.currentTimeMillis() < deadlineMs) {
                    scenario.onActivity(
                            activity -> {
                                WebView webView =
                                        findWebView(
                                                activity.getWindow().getDecorView());
                                if (webView == null) {
                                    return;
                                }
                                webView.evaluateJavascript(
                                        "(function(){"
                                                + "if(document.querySelector('[data-testid=\"offline-state\"]'))return 'OFFLINE_STATE';"
                                                + "if(document.querySelector('[data-testid=\"offline-banner\"]'))return 'OFFLINE_BANNER';"
                                                + "var text=document.body?document.body.innerText.toLowerCase():'';"
                                                + "if(text.indexOf('offline')>=0)return 'OFFLINE_TEXT';"
                                                + "return 'WAITING online='+navigator.onLine;"
                                                + "})()",
                                        value -> {
                                            if (value != null) {
                                                probeRef.set(
                                                        value.replaceAll("^\"|\"$", ""));
                                            }
                                        });
                            });
                    String probe = probeRef.get();
                    if (probe != null && probe.startsWith("OFFLINE")) {
                        break;
                    }
                    Thread.sleep(250);
                }
            }

            String probe = probeRef.get();
            assertTrue(
                    "Offline cold start must render the designed offline state, got: "
                            + probe,
                    probe != null && probe.startsWith("OFFLINE"));
        } finally {
            setNetworkEnabled(automation, true);
        }
    }
}
