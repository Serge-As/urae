# Eco-System recovery checkpoint — 0.5.1 / Master 2.3.4

This branch is a safe remote checkpoint of the recovered Eco-System project. It does **not** force-push or rewrite `main`.

## Evidence
- Exact recovered history remains preserved in the verified Git bundle kept in the founder's Eco-System Library archive.
- Local canonical source head before remote graft: `51f1df8` on `recovery/0.5.1-memory-discovery-rubric-trust`.
- Local qualification: **34/34 tests PASS**, TypeScript/Architecture/Shared Governance/Truth/Memory/Source gates PASS.
- Current Master: **2.3.4**.
- `realMoneyEnabled=false` is mandatory.
- Existing Cloudflare token/Secrets are prerequisites already acquired; their values are never committed here.

## Why a recovery archive exists
The GitHub repository previously contained only its initial README while the exact recovered history lived in a Git bundle. The `.recovery` runtime archive lets GitHub Actions immediately qualify and deploy the recovered alpha without rewriting `main` or waiting for each historical giant document to be expanded through the connector. Source expansion into ordinary repository paths remains additive in this same branch.

Runtime archive SHA-256: `4db6738d1ad3bdc6615d0cc6de6627ea1bb4489be9937241375e594cfd43d691`.

Canonical Cloudflare health endpoint: `https://eco-system.sergemimf.workers.dev/health`.
