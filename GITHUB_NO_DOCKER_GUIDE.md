# GitHub publishing — no Docker needed

## What belongs in this repository

Commit the CardSaathi app, tests, README, Drunix chaincode and gateway adapter. Do **not** copy `~/drunix` (the separate NPCI Drunix source/test-network checkout) into the repo. It is not required to run CardSaathi. Do not commit `.env`, API keys, gateway tokens, certificates/private keys, virtual environments, databases, or trained model weights.

## Verify before pushing

Run from the CardSaathi project root:

```bash
python -m unittest discover -s tests -v
node --check drunix/gateway/server.mjs
node --check frontend/app.js

git status --short
```

Verify that private files are ignored:

```bash
git check-ignore .env
 git check-ignore drunix/gateway/.env
 git check-ignore drunix/gateway/.env.org2
```

If any key, certificate/private key or real `.env` was ever committed earlier, deleting it now is not enough; rotate the exposed credential and remove it from Git history before publishing.

## Push

If this project folder already has the correct GitHub remote, add and push your source normally:

```bash
git add .
git status --short   # inspect carefully before committing
 git commit -m "Prepare CardSaathi no-Docker Drunix gateway workflow"
 git push
```

If `git push` returns an authentication/permission error, don't create a new repo or rewrite the remote blindly. Check `git remote -v` and the repository's write access first. Keep your Groq key and gateway credentials local.

## CI

The included GitHub Actions workflow runs the Python unit tests and JavaScript syntax checks on push and pull requests. It does not install Docker or try to run the Drunix network.
