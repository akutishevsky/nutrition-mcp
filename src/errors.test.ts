import { test, expect } from "bun:test";
import { ToolError, newErrorRef } from "./errors.js";

test("ToolError is an Error named ToolError", () => {
    const err = new ToolError("Pass unit ('kg' or 'lb').");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("ToolError");
    expect(err.message).toBe("Pass unit ('kg' or 'lb').");
});

test("newErrorRef is eight lowercase hex characters", () => {
    const a = newErrorRef();
    expect(a).toMatch(/^[0-9a-f]{8}$/);
    expect(newErrorRef()).not.toBe(a);
});
