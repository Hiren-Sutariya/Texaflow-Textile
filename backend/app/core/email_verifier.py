"""
Email Verification Utility for TexaFlow ERP.
Includes:
1. Syntax & format validation
2. Disposable / temporary fake email domain blocker
3. Real-time DNS MX (Mail Exchange) record check
"""

import re
import logging
from typing import Tuple

logger = logging.getLogger("email_verifier")

# Comprehensive blacklist of disposable, temporary, and 10-minute email provider domains
DISPOSABLE_EMAIL_DOMAINS = {
    # Popular disposable email services
    "temp-mail.org", "tempmail.com", "temp-mail.io", "tempmail.net",
    "10minutemail.com", "10minutemail.net", "10minmail.com", "20minutemail.it",
    "guerrillamail.com", "guerrillamail.net", "guerrillamail.org", "guerrillamail.biz",
    "guerrillamailblock.com", "sharklasers.com", "grr.la", "pokemail.net",
    "mailinator.com", "mailinator.net", "mailinater.com", "suremail.info",
    "yopmail.com", "yopmail.fr", "yopmail.net", "cool.fr.nf", "jetable.fr.nf",
    "trashmail.com", "trashmail.net", "trashmail.me", "rcpt.at",
    "dispostable.com", "throwawaymail.com", "getairmail.com", "fakeinbox.com",
    "generator.email", "mohmal.com", "nada.ltd", "inboxkitten.com",
    "maildrop.cc", "crazymailing.com", "mytemp.email", "fakemailgenerator.com",
    "emailondeck.com", "burnermail.io", "protonmail.ch", "dropmail.me",
    "mytempmail.com", "tempail.com", "tempinbox.com", "tempr.email",
    "discard.email", "discardmail.com", "spambog.com", "spambox.us",
    "mailcatch.com", "fakeemail.net", "zillamail.com", "fastmail.fm",
    "minutemailbox.com", "trashmail.org", "trash-mail.at", "wegwerfmail.de",
    "jetable.org", "kasmail.com", "sneakemail.com", "safetymail.info",
    "incognitomail.org", "harakirimail.com", "deadaddress.com", "mailnull.com",
    "trashymail.com", "binkmail.com", "bobmail.info", "chammy.info",
    "devnullmail.com", "letthemeatspam.com", "mailnesia.com", "nomail.xl.cx",
    "spamavert.com", "spamgourmet.com", "trashmail.net", "whyspam.me",
    "0-mail.com", "anonbox.net", "antichef.com", "armyspy.com",
    "cuvox.de", "dayrep.com", "einrot.com", "fleckens.hu",
    "gustr.com", "jourrapide.com", "rhyta.com", "superrito.com",
    "teleworm.us", "chacuo.net", "0clickemail.com", "byom.de",
    "gishpuppy.com", "mytempemail.com", "owlpic.com", "pookmail.com",
    "shortmail.net", "sofort-mail.de", "tempemail.net", "tempmailaddress.com",
    "tmail.com", "trashmail.ws", "trbvm.com", "uroid.com", "zetmail.com",
    "tempmailo.com", "internxt.com", "inboxbear.com", "tempm.com",
    "mailtemp.net", "fakemail.net", "crazymailing.net", "tmpmail.org",
    "tmpmail.net", "emltmp.com", "tmailor.com", "mailtemp.uk",
    "nowmymail.com", "onetimeusemail.com", "temporarymail.com",
    "tempmailgen.com", "throwawayemailaddress.com", "easytrashmail.com",
    "guerrilla.com", "spam4.me", "mailexpire.com", "mintemail.com",
    "trash-mail.com", "wegwerfadresse.de", "filzmail.com", "e4ward.com"
}

EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
)

def is_disposable_domain(domain: str) -> bool:
    """Checks if a domain or its parent domain is in the disposable list."""
    domain = domain.lower().strip()
    if domain in DISPOSABLE_EMAIL_DOMAINS:
        return True
    # Check parent domain (e.g. sub.mailinator.com -> mailinator.com)
    parts = domain.split(".")
    if len(parts) > 2:
        parent = ".".join(parts[-2:])
        if parent in DISPOSABLE_EMAIL_DOMAINS:
            return True
    return False

def check_domain_mx_record(domain: str) -> Tuple[bool, str]:
    """
    Validates that the domain has active MX (Mail Exchange) DNS records,
    or falls back to an A record as specified by RFC 5321.
    """
    domain = domain.lower().strip()
    try:
        import dns.resolver
        resolver = dns.resolver.Resolver()
        resolver.timeout = 3.0
        resolver.lifetime = 4.0

        # Try MX records first
        try:
            answers = resolver.resolve(domain, "MX")
            if answers and len(answers) > 0:
                return True, ""
        except dns.resolver.NXDOMAIN:
            return False, f"ઈમેલ ડોમેન '{domain}' અસ્તિત્વમાં નથી (Invalid domain). કૃપા કરીને સાચો ઈમેલ દાખલ કરો."
        except (dns.resolver.NoAnswer, dns.resolver.NoNameservers):
            # Fall back to RFC 5321: If no MX, mail may be sent to A record
            try:
                a_answers = resolver.resolve(domain, "A")
                if a_answers and len(a_answers) > 0:
                    return True, ""
            except Exception:
                return False, f"ઈમેલ ડોમેન '{domain}' પર કોઈ એક્ટિવ મેઈલ સર્વર (MX Record) મળ્યું નથી."
        except Exception as e:
            logger.warning(f"DNS lookup warning for {domain}: {e}")
            # If DNS resolution had a transient network timeout, allow gracefully
            return True, ""

        return False, f"ઈમેલ ડોમેન '{domain}' પર માન્ય મેઈલ સર્વર ઉપલબ્ધ નથી."
    except ImportError:
        logger.warning("dnspython is not installed; skipping DNS MX check.")
        return True, ""
    except Exception as e:
        logger.warning(f"Unexpected error in DNS MX check for {domain}: {e}")
        return True, ""

def validate_email_authenticity(email: str) -> Tuple[bool, str]:
    """
    Multi-layer validation pipeline:
    1. Regex format check
    2. Disposable/Burner domain blacklist check
    3. DNS MX record check
    Returns: (is_valid, error_message)
    """
    if not email or not isinstance(email, str):
        return False, "ઈમેલ એડ્રેસ દાખલ કરવું ફરજિયાત છે."

    clean_email = email.strip()

    # 1. Format check
    if not EMAIL_REGEX.match(clean_email):
        return False, "ઈમેલનું ફોર્મેટ અમાન્ય છે. દા.ત. name@company.com"

    try:
        user_part, domain_part = clean_email.split("@", 1)
        domain_part = domain_part.lower().strip()
    except ValueError:
        return False, "અમાન્ય ઈમેલ એડ્રેસ."

    # Minimum checks for username and domain
    if len(user_part) < 1 or len(domain_part) < 3 or "." not in domain_part:
        return False, "ઈમેલ એડ્રેસ અપૂર્ણ અથવા અમાન્ય છે."

    # 2. Disposable / temporary email check
    if is_disposable_domain(domain_part):
        return (
            False,
            f"ટેમ્પરરી અથવા ફેક ઈમેલ સર્વિસ ('{domain_part}') માન્ય નથી. કૃપા કરીને તમારો કાયમી અથવા બિઝનેસ ઈમેલ દાખલ કરો."
        )

    # 3. DNS MX Record lookup
    is_valid_mx, mx_err = check_domain_mx_record(domain_part)
    if not is_valid_mx:
        return False, mx_err

    return True, ""
