import { describe, it, expect } from "bun:test";
import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";

const window = new JSDOM("").window;
const purify = DOMPurify(window);

describe("Sanitization Verification", () => {
  it("should sanitize XSS payload", () => {
    const maliciousInput = "<script>alert('xss')</script>";
    const sanitized = purify.sanitize(maliciousInput);
    expect(sanitized).toBe("");
  });

  it("should sanitize HTML in text", () => {
      const input = "Hello <img src=x onerror=alert(1)> world";
      const sanitized = purify.sanitize(input);
      expect(sanitized).toBe("Hello <img src=\"x\"> world"); // DOMPurify removes onerror
  });

  it("should allow safe HTML", () => {
      const input = "<b>Bold</b>";
      const sanitized = purify.sanitize(input);
      expect(sanitized).toBe("<b>Bold</b>");
  });
});
