import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from datetime import datetime
from api.models import User, Resume, Job, Application
from api.auth import get_password_hash, verify_password, create_access_token
from api.schemas import UserCreate, UserLogin
from fastapi import HTTPException


class TestUserModel:
    def test_user_creation(self):
        user = User(
            email="test@example.com",
            username="testuser",
            hashed_password="hash",
            full_name="Test User",
        )
        assert user.email == "test@example.com"
        assert user.username == "testuser"
        assert user.role == "candidate"

    def test_default_role(self):
        user = User(
            email="test2@example.com", username="testuser2", hashed_password="hash"
        )
        assert user.role == "candidate"
        assert user.is_active is True


class TestPasswordHashing:
    def test_password_hash(self):
        password = "TestPassword123"
        hashed = get_password_hash(password)
        assert hashed != password
        assert len(hashed) > 0

    def test_password_verify_correct(self):
        password = "TestPassword123"
        hashed = get_password_hash(password)
        assert verify_password(password, hashed) is True

    def test_password_verify_wrong(self):
        password = "TestPassword123"
        wrong_password = "WrongPassword456"
        hashed = get_password_hash(password)
        assert verify_password(wrong_password, hashed) is False


class TestJWTToken:
    def test_create_token(self):
        token = create_access_token(data={"sub": "testuser", "role": "candidate"})
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0


class TestUserSchemas:
    def test_user_create_valid(self):
        user_data = UserCreate(
            email="newuser@example.com",
            username="newuser",
            password="Password123",
            full_name="New User",
        )
        assert user_data.email == "newuser@example.com"
        assert user_data.username == "newuser"
        assert user_data.role == "candidate"

    def test_user_create_invalid_password_short(self):
        with pytest.raises(ValueError):
            UserCreate(
                email="test@example.com",
                username="test",
                password="short",
                full_name="Test",
            )

    def test_user_create_invalid_password_no_digit(self):
        with pytest.raises(ValueError):
            UserCreate(
                email="test@example.com",
                username="test",
                password="NoDigits",
                full_name="Test",
            )


class TestResumeModel:
    def test_resume_creation(self):
        resume = Resume(
            user_id=1,
            file_name="test.pdf",
            file_path="/uploads/test.pdf",
            file_size=1024,
        )
        assert resume.file_name == "test.pdf"
        assert resume.status == "pending"
        assert resume.is_analyzed is False


class TestJobModel:
    def test_job_creation(self):
        job = Job(title="Software Engineer", company="Tech Corp", creator_id=1)
        assert job.title == "Software Engineer"
        assert job.is_active is True
        assert job.status == "pending"


class TestApplicationModel:
    def test_application_creation(self):
        app = Application(user_id=1, job_id=1, resume_id=1)
        assert app.status == "pending"
        assert app.match_score == 0.0
