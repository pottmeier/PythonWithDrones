"""Integration tests for leaderboard-api/app/main.py against a throwaway sqlite DB."""

from sqlalchemy import select

from app.models import Attempt, Score, User


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

    async def test_duplicate_username_conflicts_case_insensitive(self, client):
        await client.post("/auth/register", data={"username": "Alice", "password": "hunter22"})
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

    async def test_login_is_case_insensitive(self, client, registered_user):
        resp = await client.post(
            "/auth/login",
            data={"username": registered_user["username"].upper(), "password": registered_user["password"]},
        )
        assert resp.status_code == 200
        assert resp.json()["username"] == registered_user["username"]

    async def test_unknown_user_rejected(self, client):
        resp = await client.post("/auth/login", data={"username": "ghost", "password": "whatever1"})
        assert resp.status_code == 401


class TestSubmitScore:
    async def test_requires_auth(self, client):
        resp = await client.post(
            "/leaderboard/submit",
            json={"level_id": 1, "time_ms": 1000, "steps": 10, "lines_of_code": 5},
        )
        assert resp.status_code == 401

    async def test_rejects_invalid_token(self, client):
        resp = await client.post(
            "/leaderboard/submit",
            json={"level_id": 1, "time_ms": 1000, "steps": 10, "lines_of_code": 5},
            headers={"Authorization": "Bearer not-a-real-token"},
        )
        assert resp.status_code == 401

    async def test_success(self, client, auth_headers):
        resp = await client.post(
            "/leaderboard/submit",
            json={"level_id": 1, "time_ms": 1234, "steps": 10, "lines_of_code": 5},
            headers=auth_headers,
        )
        assert resp.status_code == 204

    async def test_second_submission_keeps_first_time(self, client, auth_headers, db_session):
        await client.post(
            "/leaderboard/submit",
            json={"level_id": 1, "time_ms": 5000, "steps": 20, "lines_of_code": 8},
            headers=auth_headers,
        )
        await client.post(
            "/leaderboard/submit",
            json={"level_id": 1, "time_ms": 1000, "steps": 5, "lines_of_code": 3},
            headers=auth_headers,
        )
        resp = await client.get("/leaderboard", params={"level_id": 1})
        assert resp.json()[0]["first_time_ms"] == 5000
        assert resp.json()[0]["steps"] == 20

        attempts = (await db_session.execute(select(Attempt).where(Attempt.level_id == 1))).scalars().all()
        assert len(attempts) == 2
        assert sorted(a.time_ms for a in attempts) == [1000, 5000]


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
                json={"level_id": 2, "time_ms": time_ms, "steps": 10, "lines_of_code": 5},
                headers={"Authorization": f"Bearer {token}"},
            )
        resp = await client.get("/leaderboard", params={"level_id": 2})
        names = [row["username"] for row in resp.json()]
        assert names == ["fast", "mid", "slow"]

    async def test_scoped_to_level(self, client, auth_headers):
        await client.post(
            "/leaderboard/submit",
            json={"level_id": 3, "time_ms": 1000, "steps": 10, "lines_of_code": 5},
            headers=auth_headers,
        )
        resp = await client.get("/leaderboard", params={"level_id": 4})
        assert resp.json() == []

    async def test_ranks_by_steps_then_time_then_loc(self, client):
        # fewer steps wins outright, even with a slower time
        entries = [
            ("many_steps_fast", {"time_ms": 1000, "steps": 20, "lines_of_code": 5}),
            ("few_steps_slow", {"time_ms": 9000, "steps": 5, "lines_of_code": 5}),
            ("tie_steps_time_more_loc", {"time_ms": 9000, "steps": 5, "lines_of_code": 8}),
            ("tie_steps_time_less_loc", {"time_ms": 9000, "steps": 5, "lines_of_code": 2}),
        ]
        for username, payload in entries:
            reg = await client.post("/auth/register", data={"username": username, "password": "hunter22"})
            token = reg.json()["access_token"]
            await client.post(
                "/leaderboard/submit",
                json={"level_id": 5, **payload},
                headers={"Authorization": f"Bearer {token}"},
            )
        resp = await client.get("/leaderboard", params={"level_id": 5})
        names = [row["username"] for row in resp.json()]
        assert names == [
            "tie_steps_time_less_loc",
            "few_steps_slow",
            "tie_steps_time_more_loc",
            "many_steps_fast",
        ]

    async def test_legacy_null_steps_sorts_last(self, client, auth_headers, db_session):
        await client.post("/auth/register", data={"username": "legacy", "password": "hunter22"})
        user = (
            await db_session.execute(select(User).where(User.username == "legacy"))
        ).scalar_one()
        db_session.add(
            Score(user_id=user.id, level_id=6, first_time_ms=1, steps=None, lines_of_code=None)
        )
        await db_session.commit()

        await client.post(
            "/leaderboard/submit",
            json={"level_id": 6, "time_ms": 9999, "steps": 50, "lines_of_code": 30},
            headers=auth_headers,
        )
        resp = await client.get("/leaderboard", params={"level_id": 6})
        names = [row["username"] for row in resp.json()]
        assert names[-1] == "legacy"


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


class TestHistory:
    async def test_requires_auth(self, client):
        resp = await client.get("/leaderboard/history", params={"level_id": 1})
        assert resp.status_code == 401

    async def test_scoped_to_user_and_level(self, client, auth_headers):
        other = await client.post("/auth/register", data={"username": "bob", "password": "hunter22"})
        other_headers = {"Authorization": f"Bearer {other.json()['access_token']}"}

        await client.post(
            "/leaderboard/submit",
            json={"level_id": 1, "time_ms": 5000, "steps": 20, "lines_of_code": 8},
            headers=auth_headers,
        )
        await client.post(
            "/leaderboard/submit",
            json={"level_id": 2, "time_ms": 1000, "steps": 5, "lines_of_code": 3},
            headers=auth_headers,
        )
        await client.post(
            "/leaderboard/submit",
            json={"level_id": 1, "time_ms": 4000, "steps": 15, "lines_of_code": 6},
            headers=other_headers,
        )

        resp = await client.get("/leaderboard/history", params={"level_id": 1}, headers=auth_headers)
        assert resp.status_code == 200
        entries = resp.json()
        assert len(entries) == 1
        assert entries[0]["time_ms"] == 5000

    async def test_returns_chronological_order_including_non_winning_attempts(self, client, auth_headers):
        await client.post(
            "/leaderboard/submit",
            json={"level_id": 1, "time_ms": 5000, "steps": 20, "lines_of_code": 8},
            headers=auth_headers,
        )
        await client.post(
            "/leaderboard/submit",
            json={"level_id": 1, "time_ms": 1000, "steps": 5, "lines_of_code": 3},
            headers=auth_headers,
        )

        resp = await client.get("/leaderboard/history", params={"level_id": 1}, headers=auth_headers)
        entries = resp.json()
        assert [e["time_ms"] for e in entries] == [5000, 1000]

        # global board still only reflects the first submission
        board = await client.get("/leaderboard", params={"level_id": 1})
        assert board.json()[0]["first_time_ms"] == 5000
