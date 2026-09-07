import html

import httpx

from ..config import settings


def _verification_email_html(full_name: str, verification_link: str) -> str:
    safe_name = html.escape(full_name)
    safe_link = html.escape(verification_link, quote=True)
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a2e;">Vérifiez votre adresse email</h2>
        <p>Bonjour {safe_name},</p>
        <p>Merci d'avoir créé votre compte sur la Plateforme BNI.</p>
        <p>Pour terminer votre inscription, veuillez confirmer votre adresse email :</p>
        <p style="text-align: center; margin: 32px 0;">
            <a href="{safe_link}"
               style="background-color: #1a1a2e; color: #ffffff; padding: 12px 28px;
                      text-decoration: none; border-radius: 6px; display: inline-block;">
                Vérifier mon adresse email
            </a>
        </p>
        <p style="color: #666; font-size: 14px;">Ce lien expirera dans 30 minutes.</p>
        <p style="color: #666; font-size: 14px;">
            Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer cet email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Cordialement,<br/>L'équipe Plateforme BNI</p>
    </div>
    """


async def send_verification_email(to_email: str, full_name: str, token: str) -> bool:
    """Envoie l'email de validation via l'API transactionnelle Brevo."""
    if not settings.MAIL_ENABLED:
        raise RuntimeError("Brevo n'est pas configuré pour l'envoi d'emails.")

    verification_link = (
        f"{settings.FRONTEND_URL.rstrip('/')}/verify-email?token={token}"
    )
    payload = {
        "sender": {
            "name": settings.MAIL_FROM_NAME,
            "email": settings.MAIL_FROM,
        },
        "to": [{"email": to_email, "name": full_name}],
        "subject": "Vérifiez votre adresse email",
        "htmlContent": _verification_email_html(full_name, verification_link),
    }

    async with httpx.AsyncClient(timeout=20.0, trust_env=False) as client:
        response = await client.post(
            f"{settings.BREVO_API_URL}/smtp/email",
            headers={
                "accept": "application/json",
                "api-key": settings.BREVO_API_KEY,
                "content-type": "application/json",
            },
            json=payload,
        )

    if response.is_error:
        print(f"[email] Brevo a répondu HTTP {response.status_code}.")
        response.raise_for_status()

    return True
