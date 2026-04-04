import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Bot, ArrowLeft } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

export default function Login() {
  const navigate = useNavigate();
  const { t } = useSettings();
  const [botMode, setBotMode] = useState(false);
  const [platformId, setPlatformId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tokenAttempted, setTokenAttempted] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token && !tokenAttempted) {
      setTokenAttempted(true);
      setIsVerifyingToken(true);
      autoTokenLogin(token);
    }
  }, []);

  const autoTokenLogin = async (token: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/auth/token_login?token=${token}`, {
        headers: { "Accept": "application/json" }
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(t("login_success"));
        window.location.href = data.redirect || "/";
      } else {
        toast.error(t("login_failed") + ": token is invalid or expired.");
        setIsVerifyingToken(false);
      }
    } catch (err) {
      toast.error(t("login_failed"));
      setIsVerifyingToken(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };


  const submitBotLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platformId || !otpCode) {
      toast.error(t("enter_id_code"));
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = { code: otpCode };
      
      // Better ID detection: if it contains @, it's WhatsApp. If it's pure digits, it's Telegram.
      if (platformId.includes("@")) {
        payload.whatsappUserId = platformId;
      } else if (/^\d+$/.test(platformId)) {
        payload.telegramUserId = Number(platformId);
      } else {
        payload.telegramUserId = platformId; // Fallback
      }

      const res = await fetch("/api/ui_login", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(t("login_success"));
        navigate("/");
        window.location.reload(); 
      } else {
        toast.error(data.error || t("login_failed"));
      }
    } catch (err) {
      toast.error(t("failed_to_save"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifyingToken) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[hsl(var(--background))] p-4 font-sans">
        <div className="text-center space-y-6">
          <div className="relative mx-auto h-24 w-24">
            <div className="absolute inset-0 rounded-3xl border-4 border-primary/10 animate-pulse"></div>
            <div className="absolute inset-0 rounded-3xl border-t-4 border-primary animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Bot className="h-10 w-10 text-primary animate-bounce" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">{t("verifying_token")}</h2>
            <p className="text-sm text-muted-foreground animate-pulse">{t("loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[hsl(var(--background))] p-4 font-sans">
      <Card className="w-full max-w-md border shadow-lg relative">
        {botMode && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute left-2 top-2 z-10" 
            onClick={() => setBotMode(false)}
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">{t("welcome_to")}</CardTitle>
          <CardDescription className="text-sm">
            {botMode 
              ? "Login using your Telegram ID or WhatsApp ID and the 6-digit code from the bot."
              : t("login_desc")}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!botMode ? (
            <>
              <Button 
                variant="outline" 
                className="w-full h-11 relative flex items-center justify-center space-x-2" 
                onClick={handleGoogleLogin}
              >
                <svg className="w-5 h-5 absolute left-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>{t("continue_with_google")}</span>
              </Button>

              <Button 
                variant="outline" 
                className="w-full h-11 relative flex items-center justify-center space-x-2 bg-[#0088cc] text-white hover:bg-[#0077b3] hover:text-white border-none" 
                onClick={() => setBotMode(true)}
              >
                <svg className="w-5 h-5 absolute left-4 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.882-.662 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span>Continue with Telegram</span>
              </Button>

              <Button 
                variant="outline" 
                className="w-full h-11 relative flex items-center justify-center space-x-2 bg-[#25D366] text-white hover:bg-[#128C7E] hover:text-white border-none" 
                onClick={() => setBotMode(true)}
              >
                <svg className="w-5 h-5 absolute left-4 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span>Continue with WhatsApp</span>
              </Button>

            </>
          ) : (
            <form onSubmit={submitBotLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bot_id">Enter User ID (Numeric ID or WhatsApp Phone)</Label>
                <Input 
                  id="bot_id" 
                  placeholder="e.g. 12345678 or 224313273802829@lid"
                  value={platformId}
                  onChange={(e) => setPlatformId(e.target.value)}
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otp_code">{t("login_otp_code")}</Label>
                <Input 
                  id="otp_code" 
                  placeholder={t("login_code_placeholder")} 
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : null}
                {t("verify_and_login")}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-4 dark:border-t text-center text-xs text-muted-foreground border-t border-border/50">
          <div className="w-full space-y-3">
            <p className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground/70">Connect with Official Bots</p>
            <div className="flex items-center justify-center gap-4">
               <a href="https://t.me/safiulalom_bot" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors hover:underline">
                 <Bot className="w-3.5 h-3.5" /> Telegram Bot
               </a>
               <a href="https://api.whatsapp.com/send?phone=8801967550181&text=start" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-[#25D366] transition-colors hover:underline">
                 <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> WhatsApp Bot
               </a>
            </div>
          </div>
          <p className="pt-2">
            {t("by_continuing_agree")}
            <Link to="/terms" className="hover:text-primary hover:underline mx-1 transition-colors">
              {t("terms_of_service")}
            </Link>
            {t("and")}
            <Link to="/privacy" className="hover:text-primary hover:underline mx-1 transition-colors">
              {t("privacy_policy")}
            </Link>
            {t("agree_to") || ""}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
