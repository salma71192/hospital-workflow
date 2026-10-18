
from django.contrib.auth.models import AnonymousUser
from rest_framework.authtoken.models import Token


class TokenAuthenticationMiddleware:
    """
    Authenticate requests using Authorization: Token <key>.
    If no token is supplied, Django's normal session user is retained.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        auth_header = request.headers.get("Authorization", "")

        if auth_header.startswith("Token "):
            token_key = auth_header.split(" ", 1)[1].strip()

            try:
                token = Token.objects.select_related("user").get(
                    key=token_key
                )
                request.user = (
                    token.user if token.user.is_active else AnonymousUser()
                )
            except Token.DoesNotExist:
                request.user = AnonymousUser()

        return self.get_response(request)
