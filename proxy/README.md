# Phantom Core Scramjet Proxy

This service embeds the current Scramjet 2.x architecture with a Wisp WebSocket transport and browser-side interception/rewriting.

## Production requirement

Run this service on a host that supports persistent WebSocket upgrades for `/wisp/`. A static/serverless deployment is not sufficient for the Wisp transport.

## Site compatibility

Scramjet lists Google and YouTube among supported sites. Compatibility is not equivalent to universal full functionality: CAPTCHA, bot protection, DRM, account authentication, network policy, and datacenter-IP restrictions can still affect individual features.

The proxy deliberately blocks private and loopback destinations to avoid becoming an SSRF service.
