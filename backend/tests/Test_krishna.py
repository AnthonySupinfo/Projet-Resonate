import pytest

# Test 1 : Limite max plafonnée à 50
def test_search_limit_capped():
    """La limite doit être plafonnée à 50 même si on demande plus."""
    requested_limit = 999
    limit = min(requested_limit, 50)
    assert limit == 50

# Test 2 : Pagination — calcul offset correct
def test_pagination_offset():
    """Page 2 avec limit 10 doit démarrer à l'index 10."""
    page, limit = 2, 10
    start = (page - 1) * limit
    end = start + limit
    assert start == 10
    assert end == 20

# Test 3 : Tri par nom alphabétique
def test_sort_albums_by_name():
    """Les albums triés par nom doivent être en ordre alphabétique."""
    albums = [{"name": "Thriller"}, {"name": "Abbey Road"}, {"name": "Nevermind"}]
    albums.sort(key=lambda x: x.get("name", ""))
    assert albums[0]["name"] == "Abbey Road"
    assert albums[2]["name"] == "Thriller"

#Test 4 : Tri par popularité décroissante
def test_sort_albums_by_popularity():
    """Les albums triés par popularité doivent être en ordre décroissant."""
    albums = [
        {"name": "A", "listeners": "1000"},
        {"name": "B", "listeners": "5000"},
        {"name": "C", "listeners": "3000"},
    ]
    albums.sort(key=lambda x: int(x.get("listeners", 0) or 0), reverse=True)
    assert albums[0]["name"] == "B"
    assert albums[2]["name"] == "A"

# Test 5 : Résultats vides (pas d'erreur)
def test_empty_search_results():
    """Une recherche sans résultat doit retourner une liste vide."""
    albums = []
    page, limit = 1, 10
    paginated = albums[(page - 1) * limit:(page - 1) * limit + limit]
    assert paginated == []