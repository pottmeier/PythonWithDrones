# PythonWithDrones
This concept was developed as part of a student project for the "Software Design" module and was later extended as part of the "Software Lifecycle Management" module.

## Project Purpose

This documentation is designed to help users understand Python by controling a virtual drone througout different levels. Users write Python code to programmatically move the drone, avoiding obstacles and reaching the goal portal. The drone's state is synchronized in real-time with a 3D visual representation in the browser, creating an interactive learning experience for understanding basic programming concepts like loops, conditionals, and spatial reasoning.

We build this project to demonstrate that programming is accessible to everyone willing to learn, and like any language whether spoken or programming comes through consistent practice and repetition.

## Contributing

We welcome contributions to this project! Feel free to fork the repository, submit pull requests, or [open issues](https://github.com/pottmeier/PythonWithDrones/issues/new/choose) to report bugs or suggest new level templates. All contributions are greatly appreciated!

## Local Development with Docker

The whole stack (frontend, leaderboard API, PostgreSQL) can be started with a single command using Docker Compose. Both the frontend and the API run in dev/reload mode with the source code mounted as a volume, so any local code change is picked up live — no rebuild needed.

```bash
docker compose up --build
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Leaderboard API: [http://localhost:8000](http://localhost:8000)
- PostgreSQL: `localhost:5432` (user `pguser` / password `pgpass` / db `leaderboard`)

Stop everything with `docker compose down` (add `-v` to also drop the Postgres volume).

# Deployment
[GitHub Pages Deployment](https://pottmeier.github.io/PythonWithDrones/)
