"""Integration tests for leaderboard-api/app/main.py against a throwaway sqlite DB."""


class TestRegister:
    async def test_success(self, client):
        resp = await client.post("/auth/register", data={"username": "alice", "password": "hunter22"})
        assert resp.status_code == 200
        body = resp.json()
        assert body["username"] == "alice"
        assert body["access_token"]

    async def test_duplicate_username_conflicts(self, client):
        await client.post("/auth/register", data={"username": "alice", "password": "hunter22"})
        resp = await client.post("/auth/register", data={"username": "alice", "password": "different1"})
        assert resp.status_code == 409

    async def test_empty_username_rejected(self, client):
        resp = await client.post("/auth/register", data={"username": "   ", "password": "hunter22"})
        assert resp.status_code == 422

    async def test_too_long_username_rejected(self, client):
        resp = await client.post("/auth/register", data={"username": "a" * 33, "password": "hunter22"})
        assert resp.status_code == 422

    async def test_short_password_rejected(self, client):
        resp = await client.post("/auth/register", data={"username": "bob", "password": "abc"})
        assert resp.status_code == 422


class TestLogin:
    async def test_success(self, client, registered_user):
        resp = await client.post(
            "/auth/login",
            data={"username": registered_user["username"], "password": registered_user["password"]},
        )
        assert resp.status_code == 200
        assert resp.json()["username"] == registered_user["username"]

    async def test_wrong_password_rejected(self, client, registered_user):
        resp = await client.post(
            "/auth/login", data={"username": registered_user["username"], "password": "nope1234"}
        )
        assert resp.status_code == 401

    async def test_unknown_user_rejected(self, client):
        resp = await client.post("/auth/login", data={"username": "ghost", "password": "whatever1"})
        assert resp.status_code == 401


class TestSubmitScore:
    async def test_requires_auth(self, client):
        resp = await client.post("/leaderboard/submit", json={"level_id": 1, "time_ms": 1000})
        assert resp.status_code == 401

    async def test_rejects_invalid_token(self, client):
        resp = await client.post(
            "/leaderboard/submit",
            json={"level_id": 1, "time_ms": 1000},
            headers={"Authorization": "Bearer not-a-real-token"},
        )
        assert resp.status_code == 401

    async def test_success(self, client, auth_headers):
        resp = await client.post(
            "/leaderboard/submit", json={"level_id": 1, "time_ms": 1234}, headers=auth_headers
        )
        assert resp.status_code == 204

    async def test_second_submission_keeps_first_time(self, client, auth_headers):
        await client.post("/leaderboard/submit", json={"level_id": 1, "time_ms": 5000}, headers=auth_headers)
        await client.post("/leaderboard/submit", json={"level_id": 1, "time_ms": 1000}, headers=auth_headers)
        resp = await client.get("/leaderboard", params={"level_id": 1})
        assert resp.json()[0]["first_time_ms"] == 5000


class TestGetLeaderboard:
    async def test_empty_leaderboard(self, client):
        resp = await client.get("/leaderboard", params={"level_id": 99})
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_sorted_by_fastest_time(self, client):
        for username, time_ms in [("slow", 9000), ("fast", 1000), ("mid", 5000)]:
            reg = await client.post("/auth/register", data={"username": username, "password": "hunter22"})
            token = reg.json()["access_token"]
            await client.post(
                "/leaderboard/submit",
                json={"level_id": 2, "time_ms": time_ms},
                headers={"Authorization": f"Bearer {token}"},
            )
        resp = await client.get("/leaderboard", params={"level_id": 2})
        names = [row["username"] for row in resp.json()]
        assert names == ["fast", "mid", "slow"]

    async def test_scoped_to_level(self, client, auth_headers):
        await client.post("/leaderboard/submit", json={"level_id": 3, "time_ms": 1000}, headers=auth_headers)
        resp = await client.get("/leaderboard", params={"level_id": 4})
        assert resp.json() == []


class TestAdminResetPassword:
    async def test_wrong_secret_forbidden(self, client, registered_user):
        resp = await client.post(
            "/admin/reset-password",
            json={"username": registered_user["username"], "new_password": "newpass1"},
            headers={"X-Admin-Secret": "wrong"},
        )
        assert resp.status_code == 403

    async def test_missing_secret_forbidden(self, client, registered_user):
        resp = await client.post(
            "/admin/reset-password",
            json={"username": registered_user["username"], "new_password": "newpass1"},
        )
        assert resp.status_code == 403

    async def test_unknown_user_not_found(self, client):
        resp = await client.post(
            "/admin/reset-password",
            json={"username": "ghost", "new_password": "newpass1"},
            headers={"X-Admin-Secret": "test-admin-secret"},
        )
        assert resp.status_code == 404

    async def test_success_changes_password(self, client, registered_user):
        resp = await client.post(
            "/admin/reset-password",
            json={"username": registered_user["username"], "new_password": "newpass1"},
            headers={"X-Admin-Secret": "test-admin-secret"},
        )
        assert resp.status_code == 204

        new_login = await client.post(
            "/auth/login", data={"username": registered_user["username"], "password": "newpass1"}
        )
        assert new_login.status_code == 200

        old_login = await client.post(
            "/auth/login",
            data={"username": registered_user["username"], "password": registered_user["password"]},
        )
        assert old_login.status_code == 401
