# Security Policy

## Reporting a vulnerability

Please **do not open a public issue** for security vulnerabilities.

Instead, report them privately by email to **ajwallacemusic@gmail.com**, or via GitHub's
[private vulnerability reporting](https://github.com/ajwallacemusic/fitness-tools/security/advisories/new).

Include as much as you can: a description, affected version(s), reproduction steps, and any
suggested fix. You'll get an acknowledgement as soon as possible, and a fix or mitigation
will be coordinated before public disclosure.

## Supported versions

This project is pre-1.0. Security fixes are applied to the **latest published version** of
`@almostjacked/fitness-tools`. Please upgrade to the latest release before reporting.

## Scope

`@almostjacked/fitness-tools` is a pure, deterministic calculation library with no I/O. The most
relevant concerns are in the reference HTTP server (`@almostjacked/fitness-tools-api`) when you deploy
it — e.g. resource use on unvalidated input. The library validates all tool input via Zod
schemas before computing.
