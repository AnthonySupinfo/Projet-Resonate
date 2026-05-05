import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings


async def send_reset_password_email(to_email: str, reset_token: str):
    """
    Envoie un email de réinitialisation de mot de passe.
    
    Le lien contient un token unique qui expire après 1h.
    L'utilisateur clique sur le lien → arrive sur /reset-password?token=xxx
    React récupère le token et permet de choisir un nouveau mot de passe.
    """
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"

    # Création du message email
    message = MIMEMultipart("alternative")
    message["Subject"] = "Réinitialisation de votre mot de passe Resonate"
    message["From"] = settings.MAIL_FROM
    message["To"] = to_email

    # Version HTML de l'email
    html_content = f"""
    <html>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px 20px 40px;
                   background-color: #1e1b26;">

        <div style="text-align: center; margin-bottom: 16px;">
          <img src="{logo_url}" alt="Resonate" width="180" height="180"
               style="object-fit: contain;" />
        </div>

        <div style="max-width: 540px; margin: 0 auto;
                    background-color: #373546;
                    border-radius: 40px;
                    border: 1px solid #4a4760;
                    padding: 40px 60px;
                    box-shadow: 0 18px 38px #000000;">

          <h1 style="margin: 0 0 4px; text-align: center; font-size: 32px; font-weight: 400;
                     color: #f2f3fb;">Resonate</h1>

          <p style="margin: 0 0 28px; text-align: center; font-size: 22px; font-weight: 400;
                    color: #f1a2a2;">Réinitialisation du mot de passe</p>

          <p style="color: #f2f3fb; font-size: 15px; margin: 0 0 10px; text-align: center;">
            Une demande de réinitialisation a été effectuée pour votre compte.
          </p>
          <p style="color: #f2f3fb; font-size: 15px; margin: 0 0 30px; text-align: center;">
            Utilisez le bouton ci-dessous pour définir un nouveau mot de passe.
          </p>

          <div style="text-align: center; margin-bottom: 32px;">
            <a href="{reset_url}"
               style="display: inline-block;
                      background: radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, rgba(146,146,146,0.6) 100%);
                      color: #f5f7ff;
                      padding: 14px 48px;
                      border-radius: 18px;
                      border: 1px solid #F49390;
                      text-decoration: none;
                      font-size: 18px;
                      font-weight: 300;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          
          <p style="color: #f2f3fb; font-size: 15px; margin: 0 0 30px; text-align: center;">
            Ce lien expire dans <strong>1 heure</strong>.
          </p>

          <p style="color: #f1a2a2; font-size: 11px; text-align: center; margin: 0;">
            Si vous n’êtes pas à l’origine de cette demande, ignorez cet email. Votre mot de passe restera inchangé.
          </p>
        </div>
      </body>
    </html>
    """

    message.attach(MIMEText(html_content, "html"))

    # Envoi via Gmail SMTP
    await aiosmtplib.send(
        message,
        hostname=settings.MAIL_HOST,
        port=settings.MAIL_PORT,
        username=settings.MAIL_USERNAME,
        password=settings.MAIL_PASSWORD,
        start_tls=True
    )