"""Identidade validada pelo provedor ainda precisa passar pela autorização local."""
import pytest
from fastapi import HTTPException
from app.auth.identity import identify_user
from app.models import Usuario


def claims(**changes):
    return {'email': 'dentist@example.test', 'email_verified': True,
            'sub': 'subject-test', 'name': 'Test Dentist'} | changes


def test_identity_creates_then_reuses_user(db):
    first = identify_user(claims(email='DENTIST@EXAMPLE.TEST'), db)
    second = identify_user(claims(name='Updated Name'), db)
    assert first.id == second.id
    assert second.nome == 'Updated Name'
    assert db.query(Usuario).count() == 1


@pytest.mark.parametrize('changes', [{'email': 'outsider@example.test'},
    {'email_verified': False}, {'email_verified': 'true'}, {'sub': None}])
def test_identity_rejects_untrusted_claims(db, changes):
    with pytest.raises(HTTPException) as error:
        identify_user(claims(**changes), db)
    assert error.value.status_code == 403
    assert db.query(Usuario).count() == 0


def test_existing_email_cannot_change_google_subject(db, user):
    with pytest.raises(HTTPException) as error:
        identify_user(claims(sub='different-subject'), db)
    assert error.value.status_code == 403
    assert user.google_subject == 'subject-test'
