from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from approvals.models import InsuranceBillingCode
from .helpers import can_use_approvals, parse_json


@csrf_exempt
def billing_codes_api(request):
    if not can_use_approvals(request.user):
        return JsonResponse({"error": "Not authorized"}, status=403)

    provider = request.GET.get("provider", "thiqa")

    if request.method == "GET":
        qs = InsuranceBillingCode.objects.filter(insurance_provider=provider)
        codes = list(
            qs.values("id", "insurance_provider", "code", "default_sessions")
        )
        return JsonResponse({"codes": codes})

    if request.method == "POST":
        data = parse_json(request)
        if data is None:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        code = (data.get("code") or "").strip()
        insurance_provider = data.get("insurance_provider", "thiqa")

        try:
            default_sessions = int(data.get("default_sessions", 6))
            if default_sessions < 0:
                default_sessions = 0
        except Exception:
            return JsonResponse({"error": "default_sessions must be a number"}, status=400)

        if not code:
            return JsonResponse({"error": "Code is required"}, status=400)

        obj, created = InsuranceBillingCode.objects.update_or_create(
            insurance_provider=insurance_provider,
            code=code,
            defaults={"default_sessions": default_sessions},
        )

        return JsonResponse({
            "success": True,
            "created": created,
            "id": obj.id,
            "message": "CPT code saved successfully",
        })

    if request.method == "DELETE":
        data = parse_json(request)
        if data is None:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        code_id = data.get("id")
        if not code_id:
            return JsonResponse({"error": "Code id is required"}, status=400)

        try:
            obj = InsuranceBillingCode.objects.get(id=code_id)
        except InsuranceBillingCode.DoesNotExist:
            return JsonResponse({"error": "Code not found"}, status=404)

        obj.delete()
        return JsonResponse({
            "success": True,
            "message": "CPT code deleted successfully",
        })

    return JsonResponse({"error": "Method not allowed"}, status=405)