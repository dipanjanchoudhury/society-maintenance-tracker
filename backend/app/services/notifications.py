from typing import List
from app.models.models import Complaint, ComplaintStatusHistory, Notice
from app.core.celery_app import send_email_task

class NotificationService:
    @staticmethod
    def send_email_async(to_email: str, subject: str, body_html: str):
        # Dispatch to celery task
        send_email_task.delay(to_email, subject, body_html)

    @staticmethod
    def notify_complaint_status_change(complaint: Complaint, history: ComplaintStatusHistory, resident_email: str, resident_name: str):
        subject = f"Update on your Complaint #{complaint.id}: {complaint.title}"
        
        note_section = f"<p><strong>Admin Note:</strong> {history.note}</p>" if history.note else ""
        
        body_html = f"""
        <html>
        <body>
            <h3>Hello {resident_name},</h3>
            <p>Your complaint status has been updated by an administrator.</p>
            <p><strong>Complaint ID:</strong> #{complaint.id}</p>
            <p><strong>Title:</strong> {complaint.title}</p>
            <p><strong>New Status:</strong> <span style="color:#2563eb; font-weight:bold;">{history.status}</span></p>
            <p><strong>Priority:</strong> {history.priority}</p>
            {note_section}
            <br/>
            <p>You can track the progress and full history of this complaint on the Society Maintenance Tracker portal.</p>
            <p>Regards,<br/>Society Administration</p>
        </body>
        </html>
        """
        NotificationService.send_email_async(resident_email, subject, body_html)

    @staticmethod
    def notify_important_notice(notice: Notice, resident_emails: List[str]):
        subject = f"[IMPORTANT NOTICE] {notice.title}"
        body_html = f"""
        <html>
        <body>
            <h3>Notice Board Update</h3>
            <p style="background-color: #fef3c7; border-left: 4px solid #d97706; padding: 12px; font-weight: 500;">
                An important notice has been pinned on the Notice Board.
            </p>
            <h4>{notice.title}</h4>
            <p style="white-space: pre-wrap;">{notice.content}</p>
            <br/>
            <p>Please log in to the Society Maintenance Tracker to view the full Notice Board.</p>
            <p>Regards,<br/>Society Administration</p>
        </body>
        </html>
        """
        for email in resident_emails:
            if email:
                NotificationService.send_email_async(email, subject, body_html)
