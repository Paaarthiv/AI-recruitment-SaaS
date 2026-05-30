from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that reads the access token from an HttpOnly
    cookie named 'access' instead of the Authorization header.

    Falls back to the Authorization header so DRF browsable API and
    Postman/curl testing with Bearer tokens still works in development.

    See: raw/architecture/cookie-auth-strategy.md
    """

    def authenticate(self, request):
        # 1. Try the HttpOnly cookie first (production path)
        raw_token = request.COOKIES.get("access")

        if raw_token is None:
            # 2. Fall back to Authorization header (dev/Postman convenience)
            header = self.get_header(request)
            if header is None:
                return None
            raw_token = self.get_raw_token(header)
            if raw_token is None:
                return None

        try:
            validated_token = self.get_validated_token(raw_token)
        except TokenError as e:
            raise InvalidToken(e.args[0]) from e

        return self.get_user(validated_token), validated_token
