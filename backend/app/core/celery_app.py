import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
celery_app = Celery("society_tasks", broker=REDIS_URL, backend=REDIS_URL)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery_app.task(name="app.core.celery_app.send_email_task")
def send_email_task(to_email: str, subject: str, body: str):
    # Fetch parameters from env again, since celery runs in a separate process
    use_mock = os.getenv("USE_MOCK_EMAIL", "true").lower() == "true"
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_from = os.getenv("SMTP_FROM", "noreply@societytracker.com")
    
    email_log_path = "/uploads/email_logs.txt"  # Log inside uploads directory so it's readable
    
    log_content = f"""
==================================================
TIMESTAMP: {datetime_now_str()}
TO: {to_email}
FROM: {smtp_from}
SUBJECT: {subject}
--------------------------------------------------
{body}
==================================================
"""
    # 1. Log to mock file (always, for debugging/local testing ease)
    try:
        # Create folder if it doesn't exist
        os.makedirs(os.path.dirname(email_log_path), exist_ok=True)
        with open(email_log_path, "a") as f:
            f.write(log_content)
    except Exception as e:
        print(f"Failed to write mock email log: {e}")

    # 2. If mock email is enabled, do not send actual SMTP email
    if use_mock:
        print(f"[MOCK EMAIL] Sent to {to_email}: {subject}")
        return f"Mock email sent to {to_email}"

    # 3. SMTP Send logic
    if not smtp_user or not smtp_password:
        print("[EMAIL ERROR] SMTP Credentials not configured. Logged to file.")
        return "Failed: SMTP Credentials missing"

    try:
        msg = MIMEMultipart()
        msg["From"] = smtp_from
        msg["To"] = to_email
        msg["Subject"] = subject
        
        msg.attach(MIMEText(body, "html"))
        
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_from, to_email, msg.as_string())
        server.quit()
        print(f"[EMAIL SUCCESS] Sent actual email to {to_email}: {subject}")
        return f"Email sent to {to_email}"
    except Exception as e:
        print(f"[EMAIL ERROR] Failed sending SMTP email to {to_email}: {str(e)}")
        return f"Failed: {str(e)}"

def datetime_now_str() -> str:
    from datetime import datetime
    return datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
