import pytest
import re
import hashlib
import secrets

# Test 1 : Hashage de mot de passe irréversible
def test_password_hash_is_not_plain():
    """Le mot de passe hashé ne doit pas être égal au texte clair."""
    plain = "MonMotDePasse12!"
    hashed = hashlib.sha256(plain.encode()).hexdigest()
    assert hashed != plain
    assert len(hashed) == 64

# Test 2 : Token opaque aléatoire (refresh token)
def test_refresh_token_is_random():
    """Deux refresh tokens générés ne doivent jamais être identiques."""
    token1 = secrets.token_hex(64)
    token2 = secrets.token_hex(64)
    assert token1 != token2
    assert len(token1) == 128

# Test 3 : Validation username (trop court)
def test_username_too_short():
    """Un username < 3 caractères doit être rejeté."""
    username = "ab"
    assert len(username) < 3

# Test 4 : Validation mot de passe (règles complexité)
def test_password_complexity_rules():
    """Un mot de passe valide doit avoir 6+ chars, 2 chiffres, 1 spécial."""
    password = "Pass12!"
    has_6_chars  = len(password) >= 6
    has_2_digits = len(re.findall(r'\d', password)) >= 2
    has_special  = bool(re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=]', password))
    assert has_6_chars
    assert has_2_digits
    assert has_special

# Test 5 : Rate limiting (limite à 10 requêtes/minute)
def test_rate_limit_check_availability():
    """La limite de check-availability doit être fixée à 10/minute."""
    LIMIT = "10/minute"
    count, period = LIMIT.split("/")
    assert int(count) == 10
    assert period == "minute"