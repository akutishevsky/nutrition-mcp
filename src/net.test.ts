import { test, expect } from "bun:test";
import { maskIp } from "./net.js";

// All addresses below are IETF-reserved documentation ranges (RFC 5737 for
// IPv4: 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24; RFC 3849 for IPv6:
// 2001:db8::/32). They are never routable to a real host.

test("maskIp drops the host octet of an IPv4 address", () => {
    expect(maskIp("203.0.113.42")).toBe("203.0.113.x");
});

test("maskIp uses only the first hop of x-forwarded-for", () => {
    expect(maskIp("203.0.113.42, 198.51.100.7, 192.0.2.1")).toBe("203.0.113.x");
});

test("maskIp keeps the /48 prefix of an IPv6 address", () => {
    expect(maskIp("2001:db8:85a3:1:2:3:4:5")).toBe("2001:db8:85a3:x");
});

test("maskIp handles compressed IPv6 without mangling", () => {
    expect(maskIp("2001:db8::1")).toBe("2001:db8:x");
});

test("maskIp never leaks a full address — malformed/loopback collapse to '-'", () => {
    expect(maskIp("::1")).toBe("-");
    expect(maskIp("garbage")).toBe("-");
    expect(maskIp("203.0.113")).toBe("-");
    expect(maskIp("")).toBe("-");
    expect(maskIp(undefined)).toBe("-");
});
