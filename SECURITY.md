# Security Policy

## Supported Versions

The following table details which versions of VoxShield are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of [VoxShield](https://github.com/codepiyusss/VoxShield) seriously. If you discover a security vulnerability, please do not disclose it publicly by creating a public issue or discussion.

### How to Report

1. **GitHub Private Advisory**: Submit a vulnerability report directly via [GitHub Security Advisories](https://github.com/codepiyusss/VoxShield/security/advisories/new).

### Information to Include

To help us evaluate and address the issue efficiently, please provide:

* A summary of the vulnerability and its potential impact.
* Detailed steps to reproduce the issue, including example audio payloads, API requests, or script snippets if applicable.
* The specific component affected (e.g., Flask API in `app.py`, audio processing pipeline, or React frontend).

### Response Policy

* **Acknowledgement**: We aim to acknowledge receipt of your report within 48 hours.
* **Assessment & Fix**: We will evaluate the report within 7 days and provide an estimated timeline for a patch release.
* **Public Disclosure**: Once a fix is deployed, we will publish a security advisory giving full credit to the reporter (unless requested otherwise).

## Security Considerations for VoxShield

* **Environment Secrets**: Never commit `.env` files or API secrets. Always configure production environments using secure environment variables.
* **Deserialization Safety**: Ensure pre-trained model files (`voice_model.pkl`) are only loaded from trusted local paths or authenticated storage locations.
* **API Protection**: Apply rate-limiting and origin checks (CORS) on Flask backend endpoints processing real-time audio streams.
