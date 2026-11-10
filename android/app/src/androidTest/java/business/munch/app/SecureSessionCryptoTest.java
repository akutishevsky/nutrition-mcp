package business.munch.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;

import android.util.Base64;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import java.nio.charset.StandardCharsets;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * Regression gate for the installed-session crypto path
 * (MunchSecureSessionPlugin). Google sign-in and the magic-link flow both
 * persist the installed session through this AES-GCM envelope, and the
 * 2026-11-10 Pixel defect — sign-in completing, then "Unable to store
 * the installed Munch session" — was the encrypt side throwing against a
 * real AndroidKeyStore key. That failure is invisible to JVM unit tests
 * because AndroidKeyStore only exists on a device/emulator, so this
 * round-trip runs instrumented, in the emulator boot lane.
 */
@RunWith(AndroidJUnit4.class)
public class SecureSessionCryptoTest {

    private static final String TOKEN = "installed-session-token-crypto-test";

    @Test
    public void storeReadRoundTripThroughAndroidKeyStore() throws Exception {
        SecretKey key = MunchSecureSessionPlugin.loadOrCreateKey();

        String envelope = MunchSecureSessionPlugin.encrypt(key, TOKEN);

        // The stored envelope stays base64(iv) + "." + base64(ciphertext)
        // with a 12-byte GCM IV, so the decrypt path and any previously
        // stored value remain readable.
        String[] parts = envelope.split("\\.", 2);
        assertEquals(2, parts.length);
        assertEquals(12, Base64.decode(parts[0], Base64.NO_WRAP).length);

        assertEquals(TOKEN, MunchSecureSessionPlugin.decrypt(key, envelope));
    }

    @Test
    public void encryptionIsRandomizedAcrossCalls() throws Exception {
        SecretKey key = MunchSecureSessionPlugin.loadOrCreateKey();

        String first = MunchSecureSessionPlugin.encrypt(key, TOKEN);
        String second = MunchSecureSessionPlugin.encrypt(key, TOKEN);

        // The key requires randomized encryption: two encryptions of the
        // same value must not share an IV or ciphertext.
        assertNotEquals(first, second);
        assertEquals(TOKEN, MunchSecureSessionPlugin.decrypt(key, first));
        assertEquals(TOKEN, MunchSecureSessionPlugin.decrypt(key, second));
    }

    @Test
    public void decryptOpensEnvelopeSealedWithProviderGeneratedIv()
            throws Exception {
        SecretKey key = MunchSecureSessionPlugin.loadOrCreateKey();

        // Seal an envelope the way any correct writer does: initialize
        // the cipher without an IV so the provider generates one, then
        // store base64(iv) + "." + base64(ciphertext). The production
        // decrypt path — which may specify the stored IV — must open it.
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key);
        byte[] iv = cipher.getIV();
        byte[] sealed = cipher.doFinal(TOKEN.getBytes(StandardCharsets.UTF_8));
        String envelope =
                Base64.encodeToString(iv, Base64.NO_WRAP)
                        + "."
                        + Base64.encodeToString(sealed, Base64.NO_WRAP);

        assertEquals(TOKEN, MunchSecureSessionPlugin.decrypt(key, envelope));
    }
}
