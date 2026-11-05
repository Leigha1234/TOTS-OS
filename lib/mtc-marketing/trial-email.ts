function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return replacements[char];
  });
}

const emailContent: Record<
  string,
  { subject: string; heading: string; message: string; button: string }
> = {
  welcome: {
    subject: "Welcome to Moray Training Club! 💛",
    heading: "YOUR FIRST WEEK STARTS HERE.",
    message:
      "Welcome to the MTC community! Your seven-day trial is your chance to explore our classes, meet the coaches and discover what makes our gym different. Book your first session and come say hello!",
    button: "BOOK YOUR FIRST CLASS",
  },
  day_5: {
    subject: "How's your first week at MTC going?",
    heading: "FIND YOUR STRONG.",
    message:
      "You've nearly completed your first week at MTC! Whether you've tried CrossFit, HYROX or something completely different, we'd love to help you keep building momentum. Need help choosing a membership? Just ask our team.",
    button: "EXPLORE MEMBERSHIPS",
  },
  day_7: {
    subject: "Your MTC trial is ending — here's £10 off 💛",
    heading: "THIS IS JUST THE BEGINNING.",
    message:
      "Your free trial is coming to an end. We'd love you to stay! Use code WELCOME10 to get £10 off your monthly membership, subject to the offer's terms and eligibility.",
    button: "BECOME A MEMBER",
  },
  day_10: {
    subject: "We'd love to see you back at MTC!",
    heading: "YOUR PLACE IS WAITING.",
    message:
      "Your trial has finished, but your journey doesn't have to. Join the MTC community and use WELCOME10 for £10 off your monthly membership, subject to the offer's terms and eligibility.",
    button: "JOIN THE CLUB",
  },
};

export function buildEmail(
  step: string,
  unsubscribeUrl: string,
  bookingUrl: string
) {
  const content = emailContent[step];

  if (!content) throw new Error("Unknown email step");

  const safeUrl = escapeHtml(bookingUrl);
  const safeUnsubscribe = escapeHtml(unsubscribeUrl);

  return {
    subject: content.subject,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </head>
      <body style="margin:0;padding:30px 12px;background:#101010;font-family:Arial,sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr><td align="center">
            <table role="presentation" width="100%" style="max-width:560px;background:#191919;">
              <tr>
                <td style="padding:35px;text-align:center;background:#f5d900;">
                  <h1 style="margin:0;color:#111;font-size:27px;letter-spacing:2px;">
                    MORAY TRAINING CLUB
                  </h1>
                </td>
              </tr>
              <tr>
                <td style="padding:42px 30px;text-align:center;">
                  <h2 style="color:#f5d900;font-size:29px;line-height:1.2;">
                    ${escapeHtml(content.heading)}
                  </h2>
                  <p style="color:#eee;font-size:16px;line-height:1.8;">
                    ${escapeHtml(content.message)}
                  </p>
                  <a href="${safeUrl}"
                     style="display:inline-block;margin-top:20px;padding:16px 26px;background:#f5d900;color:#111;text-decoration:none;font-weight:bold;">
                    ${escapeHtml(content.button)}
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding:24px;text-align:center;background:#111;color:#aaa;font-size:12px;">
                  Moray Training Club<br /><br />
                  <a href="${safeUnsubscribe}" style="color:#f5d900;">
                    Unsubscribe from marketing emails
                  </a>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };
}

