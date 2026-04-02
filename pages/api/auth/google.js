async function handler(req, res) {
  const hostUrl = process.env.APP_URL || (process.env.NODE_ENV === "production" ? `https://${req.headers.host}` : `http://${req.headers.host}`);
  const redirectUri = `${hostUrl}/api/auth/google_callback`;
  const clientId = process.env.AUTH_GOOGLE_ID;

  if (!clientId) {
    res.statusCode = 500;
    res.end("Google OAuth is not configured. Missing AUTH_GOOGLE_ID");
    return;
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.append("client_id", clientId);
  url.searchParams.append("redirect_uri", redirectUri);
  url.searchParams.append("response_type", "code");
  url.searchParams.append("scope", "email profile openid");
  url.searchParams.append("access_type", "online");

  res.redirect(302, url.toString());
}

module.exports = handler;
module.exports.default = handler;
