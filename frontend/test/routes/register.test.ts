import { describe, expect, it, vi } from "vitest";

describe("register route", () => {
  it("returns server-side field errors before calling the API", async () => {
    vi.stubEnv("API_BASE_URL", "http://localhost:8080");
    vi.stubEnv("SESSION_SECRET", "test-session-secret-at-least-32-characters");
    const { action } = await import("~/routes/register");
    const form = new FormData();
    form.set("email", "member@projectsale.vn");
    form.set("password", "short");
    form.set("confirm_password", "different");
    const request = new Request("http://localhost/register", { method: "POST", body: form });

    const result = await action({ request, params: {}, context: {} } as never);
    const payload = (result as { data: { fieldErrors: Record<string, string | undefined> } }).data;

    expect(payload.fieldErrors.full_name).toBeTruthy();
    expect(payload.fieldErrors.password).toBeTruthy();
    expect(payload.fieldErrors.confirm_password).toBeTruthy();
    expect(payload.fieldErrors.terms).toBeTruthy();
  });
});
