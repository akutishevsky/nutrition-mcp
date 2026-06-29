// Coarsen a client IP before it ever reaches a log line. A full IP is personal
// data; for diagnosing traffic we only need subnet-level granularity to tell a
// single-source flood from distributed traffic — never to identify or block an
// individual. IPv4 keeps the first three octets, IPv6 the first three hextets,
// with the host portion replaced by "x". The full address is never returned.
export function maskIp(forwardedFor: string | undefined): string {
    const raw = forwardedFor?.split(",")[0]?.trim();
    if (!raw) return "-";
    if (raw.includes(":")) {
        // Take the hextets before any "::" compression — leading groups are
        // always literal, so this never mangles a compressed address.
        const head = raw.split("::")[0]!.split(":").filter(Boolean).slice(0, 3);
        return head.length ? head.join(":") + ":x" : "-";
    }
    const octets = raw.split(".");
    if (octets.length !== 4 || octets.some((o) => o === "")) return "-";
    return `${octets[0]}.${octets[1]}.${octets[2]}.x`;
}
