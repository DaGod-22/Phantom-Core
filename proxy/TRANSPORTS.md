# Phantom Core proxy transport notes

Phantom Core uses Scramjet 2.x with Wisp and supports both libcurl and Epoxy transports. The browser selects libcurl first and can fall back to Epoxy if the first transport cannot initialize.

A deployment must preserve long-lived WebSocket upgrades for `/wisp/`. Serverless platforms that do not provide persistent WebSockets are not suitable for the Wisp endpoint.

Google and YouTube are supported targets in Scramjet, but site anti-bot systems, CAPTCHAs, DRM, account sign-in, and datacenter-IP restrictions can still prevent full functionality. No implementation should claim universal unrestricted access without an end-to-end browser test.
