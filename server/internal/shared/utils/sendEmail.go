package utils

// package utils

import (
	"fmt"
	"log"
	"os"

	"github.com/resend/resend-go/v3"
)

func SendEmail(email string, OTP string) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		return fmt.Errorf("RESEND_API_KEY environment variable is missing")
	}

	client := resend.NewClient(apiKey)

	htmlContent := fmt.Sprintf(`
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Verify your email</title>
	</head>
	<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
		<table width="100%%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 48px 24px;">
			<tr>
				<td align="center">
					<table width="100%%" max-width="500px" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
						<!-- Brand Banner Layer -->
						<tr>
							<td style="background: #0f172a; padding: 32px; text-align: center;">
								<span style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">STREAMOS <span style="color: #3b82f6;">INFRA</span></span>
							</td>
						</tr>
						<!-- Body Copy Layer -->
						<tr>
							<td style="padding: 40px 32px;">
								<h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: #0f172a; tracking: -0.5px;">Verify your email address</h1>
								<p style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #475569;">
									Thank you for choosing StreamOS. To complete your onboarding registration workspace setup, please enter the single-use authorization code provided below:
								</p>
								
								<!-- OTP Box -->
								<table width="100%%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
									<tr>
										<td align="center" style="background-color: #f1f5f9; border-radius: 8px; padding: 18px; border: 1px dashed #cbd5e1;">
											<span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; color: #0f172a; letter-spacing: 6px; padding-left: 6px;">%s</span>
										</td>
									</tr>
								</table>

								<p style="margin: 0 0 32px 0; font-size: 13px; line-height: 20px; color: #64748b;">
									⚡ This verification window expires in <strong>15 minutes</strong>. If you did not make this transaction request, you can safely ignore this automated system notification.
								</p>
								
								<div style="border-top: 1px solid #e2e8f0; padding-top: 24px;">
									<p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 18px;">
										Best regards,<br>
										<strong>The StreamOS Operations Team</strong>
									</p>
								</div>
							</td>
						</tr>
					</tr>
				</table>
			</td>
		</table>
	</body>
	</html>
	`, OTP)

	params := &resend.SendEmailRequest{
		From:    "StreamOS Onboarding <onboarding@resend.dev>", // Replace resend.dev with your domain once verified
		To:      []string{email},                              // 💡 Dynamic recipient validation routing
		Subject: fmt.Sprintf("%s is your StreamOS verification code", OTP),
		Html:    htmlContent,
	}

	sent, err := client.Emails.Send(params)
	if err != nil {
		return err
	}
	
	log.Printf("[MAIL-ROUTER] Verification broadcast succeeded: ID=%s -> Target=%s", sent.Id, email)
	return nil
}