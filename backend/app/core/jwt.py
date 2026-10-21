"""
Cryptographic JWT Token Utility (RFC 7519 HS256)
Pure Python implementation with HMAC-SHA256 and constant-time signature verification.
Provides tamper-proof tenant and user authentication without external dependencies.
"""
import os
import hmac
import hashlib
import json
import base64
import time
from typing import Optional, Dict, Any

# Cryptographic secret key for signing tokens
JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY", 
    "texaflow-production-secure-jwt-key-2026-texa-erp-om-sai-enterprise-master-secret"
)

# Default token lifetime: 30 days
DEFAULT_EXPIRE_SECONDS = 86400 * 30

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")

def _b64url_decode(data: str) -> bytes:
    padding = 4 - (len(data) % 4)
    if padding < 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data.encode("utf-8"))

def create_access_token(payload: Dict[str, Any], expires_delta_seconds: int = DEFAULT_EXPIRE_SECONDS) -> str:
    """
    Creates a signed JWT with HS256 algorithm containing user and tenant company claims.
    """
    header = {"alg": "HS256", "typ": "JWT"}
    body = payload.copy()
    now = int(time.time())
    body["iat"] = now
    body["exp"] = now + expires_delta_seconds

    h_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    b_b64 = _b64url_encode(json.dumps(body, separators=(",", ":")).encode("utf-8"))
    
    signing_input = f"{h_b64}.{b_b64}".encode("utf-8")
    signature = _b64url_encode(
        hmac.new(JWT_SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
    )
    return f"{h_b64}.{b_b64}.{signature}"

def verify_access_token(token: str) -> Dict[str, Any]:
    """
    Verifies token signature using constant-time comparison and checks expiration.
    Returns the decoded claims dictionary.
    Raises ValueError on invalid token, signature mismatch, or expired token.
    """
    if not token or not isinstance(token, str):
        raise ValueError("Token missing or not a string")

    parts = token.strip().split(".")
    if len(parts) != 3:
        raise ValueError("Invalid JWT token format (expected 3 parts)")

    h_b64, b_b64, sig = parts
    signing_input = f"{h_b64}.{b_b64}".encode("utf-8")
    expected_sig = _b64url_encode(
        hmac.new(JWT_SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
    )

    # Constant-time comparison protects against timing attacks
    if not hmac.compare_digest(sig, expected_sig):
        raise ValueError("Invalid JWT signature (token forged or tampered with)")

    try:
        payload_bytes = _b64url_decode(b_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))
    except Exception as e:
        raise ValueError(f"Failed to decode token payload: {e}")

    now = int(time.time())
    if "exp" in payload and payload["exp"] < now:
        raise ValueError("Token has expired. Please log in again.")

    return payload
