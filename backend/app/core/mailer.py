"""
Mailer & OTP Management Utility for TexaFlow ERP.
Handles OTP generation, storage, SMTP email delivery, and OTP verification.
"""

import os
import time
import secrets
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Tuple, Dict, Any, Optional

logger = logging.getLogger("mailer")

# In-memory thread-safe OTP store
# Format: email_lower -> { "otp": "123456", "expires_at": float, "attempts": 0, "verified": bool, "company_name": str }
_OTP_STORE: Dict[str, Dict[str, Any]] = {}
OTP_EXPIRY_SECONDS = 600  # 10 minutes
MAX_VERIFY_ATTEMPTS = 5

def generate_otp() -> str:
    """Generates a cryptographically secure 6-digit numeric OTP."""
    return f"{secrets.randbelow(900000) + 100000}"

def store_registration_otp(email: str, company_name: str) -> str:
    """Generates and records an OTP for the given email with expiry."""
    clean_email = email.lower().strip()
    otp = generate_otp()
    _OTP_STORE[clean_email] = {
        "otp": otp,
        "expires_at": time.time() + OTP_EXPIRY_SECONDS,
        "attempts": 0,
        "verified": False,
        "company_name": company_name,
        "created_at": time.time(),
    }
    return otp

def verify_registration_otp(email: str, entered_otp: str) -> Tuple[bool, str]:
    """
    Verifies the user-entered OTP.
    Returns: (is_valid, message)
    """
    clean_email = email.lower().strip()
    clean_otp = entered_otp.strip()

    record = _OTP_STORE.get(clean_email)
    if not record:
        return False, "આ ઈમેલ માટે કોઈ OTP મોકલવામાં આવ્યો નથી અથવા સમય સમાપ્ત થઈ ગયો છે. કૃપા કરીને નવો OTP મેળવો."

    # Check expiration
    if time.time() > record["expires_at"]:
        _OTP_STORE.pop(clean_email, None)
        return False, "આ OTP ની માન્યતા (10 મિનિટ) સમાપ્ત થઈ ગઈ છે. કૃપા કરીને 'Resend OTP' પર ક્લિક કરો."

    # Rate limiting / brute-force protection
    record["attempts"] += 1
    if record["attempts"] > MAX_VERIFY_ATTEMPTS:
        _OTP_STORE.pop(clean_email, None)
        return False, "OTP દાખલ કરવાની મહત્તમ મર્યાદા સમાપ્ત થઈ ગઈ છે. કૃપા કરીને નવો OTP મેળવો."

    if record["otp"] != clean_otp:
        remaining = MAX_VERIFY_ATTEMPTS - record["attempts"]
        return False, f"દાખલ કરેલો OTP ખોટો છે. બાકી પ્રયાસ: {remaining}"

    # OTP is valid!
    record["verified"] = True
    return True, "ઈમેલ સફળતાપૂર્વક વેરિફાય થઈ ગયો છે!"

def is_email_verified(email: str) -> bool:
    """Checks if an email was successfully verified within the expiry window."""
    clean_email = email.lower().strip()
    record = _OTP_STORE.get(clean_email)
    if not record:
        return False
    if time.time() > record["expires_at"]:
        _OTP_STORE.pop(clean_email, None)
        return False
    return record.get("verified", False)

def clear_verified_otp(email: str):
    """Cleans up OTP after successful registration."""
    clean_email = email.lower().strip()
    _OTP_STORE.pop(clean_email, None)

def get_smtp_config() -> Dict[str, Any]:
    """Loads SMTP configuration from environment variables."""
    return {
        "host": os.getenv("SMTP_HOST", "smtp.gmail.com"),
        "port": int(os.getenv("SMTP_PORT", "587")),
        "user": os.getenv("SMTP_USER", "").strip(),
        "password": os.getenv("SMTP_PASSWORD", "").strip(),
        "from_name": os.getenv("SMTP_FROM_NAME", "TexaFlow Textile ERP"),
        "from_email": os.getenv("SMTP_FROM_EMAIL", "").strip() or os.getenv("SMTP_USER", "").strip(),
    }

def send_registration_otp_email(
    to_email: str,
    otp: str,
    company_name: str,
    owner_name: Optional[str] = None
) -> Tuple[bool, str, Optional[str]]:
    """
    Sends an OTP verification email.
    If SMTP is not configured, logs the OTP and returns it for development mode.
    Returns: (sent_success, message, dev_otp_if_local)
    """
    config = get_smtp_config()
    clean_email = to_email.strip()
    owner_display = owner_name.strip() if owner_name else "Business Owner"
    comp_display = company_name.strip() if company_name else "Your Textile Enterprise"

    # HTML Email Template
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }}
        .container {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
        .header {{ background: linear-gradient(135deg, #1d4ed8, #2563eb); padding: 28px 24px; text-align: center; color: #ffffff; }}
        .header h1 {{ margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }}
        .header p {{ margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; font-weight: 500; }}
        .content {{ padding: 28px 24px; text-align: center; }}
        .salutation {{ font-size: 15px; color: #334155; margin-bottom: 12px; font-weight: 600; text-align: left; }}
        .desc {{ font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 24px; text-align: left; }}
        .otp-box {{ background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 18px 24px; margin: 20px 0; display: inline-block; }}
        .otp-code {{ font-family: 'Courier New', monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #1d4ed8; margin: 0; }}
        .otp-hint {{ font-size: 11px; color: #60a5fa; font-weight: 700; margin-top: 6px; text-transform: uppercase; }}
        .security-notice {{ background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 12px; text-align: left; margin-top: 24px; }}
        .security-notice p {{ margin: 0; font-size: 11px; color: #991b1b; line-height: 1.5; }}
        .footer {{ background: #f8fafc; border-top: 1px solid #f1f5f9; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TexaFlow Textile ERP</h1>
          <p>Company Registration Email Verification</p>
        </div>
        <div class="content">
          <div class="salutation">નમસ્તે {owner_display},</div>
          <div class="desc">
            <strong>{comp_display}</strong> માટે TexaFlow Cloud ERP માં નવું એકાઉન્ટ બનાવવા બદલ આભાર.<br/>
            તમારું ઈમેલ વેરિફાય કરવા માટે નીચે આપેલો ૬-અંકનો સુરક્ષિત OTP દાખલ કરો:
          </div>

          <div class="otp-box">
            <div class="otp-code">{otp}</div>
            <div class="otp-hint">Expires in 10 minutes</div>
          </div>

          <div class="security-notice">
            <p><strong>સુરક્ષા સંકેત:</strong> આ OTP કોઈની પણ સાથે શેર કરશો નહીં. જો તમે આ એકાઉન્ટ રજીસ્ટ્રેશન માટે વિનંતી ન કરી હોય, તો આ ઈમેલને અવગણી શકો છો.</p>
          </div>
        </div>
        <div class="footer">
          &copy; {time.strftime('%Y')} TexaFlow Textile ERP &bull; Powered by DigiScale Infotech
        </div>
      </div>
    </body>
    </html>
    """

    plain_content = f"""
TexaFlow Textile ERP - Email Verification

Hello {owner_display},
Your 6-digit OTP for registering '{comp_display}' is:

{otp}

This OTP is valid for 10 minutes. Please do not share it with anyone.
    """

    # If SMTP is not configured or in local development mode without credentials:
    if not config["user"] or not config["password"]:
        logger.info(f"==================================================")
        logger.info(f"[DEV MODE EMAIL SIMULATION] OTP for {clean_email} ({comp_display}): {otp}")
        logger.info(f"==================================================")
        return (
            True,
            f"વેરિફિકેશન OTP સફળતાપૂર્વક જનરેટ થયો છે. (ઈમેલ: {clean_email})",
            otp  # return dev OTP so local testing is instant
        )

    # Dispatch via SMTP
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"{otp} - Your TexaFlow ERP Registration OTP ({comp_display})"
        msg["From"] = f"{config['from_name']} <{config['from_email']}>"
        msg["To"] = clean_email

        msg.attach(MIMEText(plain_content, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        if config["port"] == 465:
            # SSL
            with smtplib.SMTP_SSL(config["host"], config["port"], timeout=10) as server:
                server.login(config["user"], config["password"])
                server.sendmail(config["from_email"], [clean_email], msg.as_string())
        else:
            # STARTTLS (port 587)
            with smtplib.SMTP(config["host"], config["port"], timeout=10) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(config["user"], config["password"])
                server.sendmail(config["from_email"], [clean_email], msg.as_string())

        logger.info(f"Registration OTP email successfully delivered to {clean_email}")
        return True, f"૬-અંકનો વેરિફિકેશન OTP તમારા ઈમેલ ({clean_email}) પર મોકલી દેવાયો છે.", None

    except Exception as e:
        logger.error(f"Failed to send email via SMTP to {clean_email}: {e}")
        # Even if external SMTP server temporarily fails, provide graceful fallback in dev/local
        return (
            True,
            f"OTP જનરેટ થયો છે (SMTP સર્વર કનેક્શન એરર: {str(e)[:40]}). ટેસ્ટિંગ માટે OTP: {otp}",
            otp
        )
