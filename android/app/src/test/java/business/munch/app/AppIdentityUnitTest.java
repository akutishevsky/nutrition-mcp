package business.munch.app;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

/**
 * Guards the packaged application identity on the JVM lane. Replaces the
 * stock Capacitor template ExampleUnitTest (a 2 + 2 arithmetic check in
 * the template package that verified nothing about Munch).
 */
public class AppIdentityUnitTest {

    @Test
    public void applicationIdMatchesThePackagedApp() {
        assertEquals("business.munch.app", BuildConfig.APPLICATION_ID);
    }

    @Test
    public void versionNameIsDeclared() {
        assertEquals("1.0", BuildConfig.VERSION_NAME);
    }
}
