import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { getQueuedTeamId } from "./processQueue";

describe("getQueuedTeamId", () => {
  it("returns the team ID of an active queued user", () => {
    assert.equal(
      getQueuedTeamId({ queueStatus: "queued", teamId: "team-1" }),
      "team-1",
    );
  });

  it("rejects a user whose account was deleted", () => {
    assert.equal(
      getQueuedTeamId({
        queueStatus: "queued",
        teamId: "team-1",
        status: "deleted",
      }),
      null,
    );
  });

  it("rejects a missing or empty team ID", () => {
    assert.equal(getQueuedTeamId({ queueStatus: "queued" }), null);
    assert.equal(getQueuedTeamId({ queueStatus: "queued", teamId: "" }), null);
  });
});
