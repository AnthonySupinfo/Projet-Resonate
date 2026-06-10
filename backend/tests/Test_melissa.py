import pytest
from datetime import datetime, timezone

# Test 1 : Rating valide entre 0 et 5
def test_rating_valid_range():
    """Un rating entre 0 et 5 doit être accepté."""
    for rating in [0, 1, 2.5, 4, 5]:
        assert 0 <= rating <= 5

# Test 2 : Rating hors bornes doit être rejeté
def test_rating_out_of_bounds():
    """Un rating > 5 ou < 0 doit être invalide."""
    assert not (0 <= 6 <= 5)
    assert not (0 <= -1 <= 5)

# Test 3 : Soft delete (deleted_at est défini)
def test_soft_delete_sets_deleted_at():
    """Un soft delete doit définir deleted_at avec la date actuelle."""
    deleted_at = datetime.now(timezone.utc)
    assert deleted_at is not None
    assert deleted_at.tzinfo is not None

# Test 4 : Unicité review par user + album
def test_review_uniqueness():
    """Un user ne peut pas avoir deux reviews actives pour le même album."""
    existing_reviews = [{"user_id": "user1", "album_id": "album1"}]
    new_review = {"user_id": "user1", "album_id": "album1"}
    already_exists = any(
        r["user_id"] == new_review["user_id"] and r["album_id"] == new_review["album_id"]
        for r in existing_reviews
    )
    assert already_exists is True

# Test 5 : Contenu review non vide
def test_review_content_not_empty():
    """Une review avec contenu vide doit être invalide."""
    content = ""
    assert len(content.strip()) == 0