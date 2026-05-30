from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Allows access only to admin users."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)


class IsRecruiter(permissions.BasePermission):
    """Allows access only to recruiter users."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_recruiter)


class IsHiringManager(permissions.BasePermission):
    """Allows access only to hiring manager users."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == request.user.Role.HIRING_MANAGER
        )


class IsInterviewer(permissions.BasePermission):
    """Allows access only to interviewer users."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == request.user.Role.INTERVIEWER
        )


class IsVerifiedRecruiter(permissions.BasePermission):
    """
    Allows access only to recruiters whose organization AND recruiter profile
    are fully approved by an admin.
    """

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated and user.is_recruiter):
            return False

        if not hasattr(user, "recruiter_profile"):
            return False

        profile = user.recruiter_profile
        if not profile.is_approved:
            return False

        if not profile.organization or not profile.organization.is_approved:
            return False

        return True


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    The request is authenticated as a user, or is a read-only request.
    Write permissions are only allowed to admin users.
    """

    def has_permission(self, request, view):
        return bool(
            request.method in permissions.SAFE_METHODS
            or (request.user and request.user.is_authenticated and request.user.is_admin)
        )
