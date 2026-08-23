from ..config import settings

_fm = None


def _get_mailer():
    """Construit le client SMTP a la demande, uniquement si les identifiants
    sont fournis. Evite de faire planter l'app au demarrage quand le SMTP
    n'est pas configure (dev local / demo)."""
    global _fm
    if _fm is None and settings.MAIL_ENABLED:
        from fastapi_mail import FastMail, ConnectionConfig

        conf = ConnectionConfig(
            MAIL_USERNAME=settings.MAIL_USERNAME,
            MAIL_PASSWORD=settings.MAIL_PASSWORD,
            MAIL_FROM=settings.MAIL_FROM,
            MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
            MAIL_PORT=settings.MAIL_PORT,
            MAIL_SERVER=settings.MAIL_SERVER,
            MAIL_STARTTLS=True,
            MAIL_SSL_TLS=False,
            USE_CREDENTIALS=True,
            VALIDATE_CERTS=True,
        )
        _fm = FastMail(conf)
    return _fm


def _verification_email_html(full_name: str, verification_link: str) -> str:
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a2e;">Vérifiez votre adresse email</h2>
        <p>Bonjour {full_name},</p>
        <p>Merci d'avoir créé votre compte sur la Plateforme BNI.</p>
        <p>Pour terminer votre inscription, veuillez confirmer votre adresse email :</p>
        <p style="text-align: center; margin: 32px 0;">
            <a href="{verification_link}"
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


async def send_verification_email(to_email: str, full_name: str, token: str) -> None:
    """
    Envoie l'email de vérification à l'utilisateur.
    C'est la SEULE fonction que le reste de l'app doit appeler —
    aucun autre fichier ne doit connaître Brevo, SMTP, ou fastapi-mail directement.

    Si le SMTP n'est pas configure (settings.MAIL_ENABLED == False), la
    fonction n'envoie rien et se contente de logger le lien de verification
    - pratique en dev local / demo sans avoir a configurer un vrai SMTP.
    """
    verification_link = f"{settings.FRONTEND_URL}/verify-email?token={token}"

    mailer = _get_mailer()
    if mailer is None:
        print(f"[email] SMTP non configure - lien de verification pour {to_email}: {verification_link}")
        return

    from fastapi_mail import MessageSchema, MessageType

    message = MessageSchema(
        subject="Vérifiez votre adresse email",
        recipients=[to_email],
        body=_verification_email_html(full_name, verification_link),
        subtype=MessageType.html,
    )

    try:
        await mailer.send_message(message)
    except Exception as exc:
        # On ne bloque jamais l'inscription si l'envoi d'email echoue.
        print(f"[email] Echec de l'envoi de l'email de verification a {to_email}: {exc}")
