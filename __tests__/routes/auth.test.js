import request from "supertest";
import app from "../../src/app.js";

describe("Auth Routes", () => {
  test("Get /api/health - should return 200 OK", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
