# OAuth continuation incident

Production authorization reached the custom consent page but `POST /connect/consent` returned `401 invalid_request` with `request not found`. The corrective PR preserves Better Auth's signed OAuth transaction through the actual HTTP endpoints and adds a browser-equivalent regression test.
