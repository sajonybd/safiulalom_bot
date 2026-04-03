import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const [telegramMode, setTelegramMode] = useState(false);
  const [telegramId, setTelegramId] = useState("");
  const [telegramCode, setTelegramCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tokenAttempted, setTokenAttempted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token && !tokenAttempted) {
      setTokenAttempted(true);
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
      }
    } catch (err) {
      toast.error(t("login_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const submitTelegramLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramId || !telegramCode) {
      toast.error(t("enter_id_code"));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/ui_login", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramUserId: Number(telegramId), code: telegramCode })
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

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[hsl(var(--background))] p-4 font-sans">
      <Card className="w-full max-w-md border shadow-lg relative">
        {telegramMode && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute left-2 top-2 z-10" 
            onClick={() => setTelegramMode(false)}
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
            {telegramMode 
              ? t("telegram_login_desc")
              : t("login_desc")}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!telegramMode ? (
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
                onClick={() => setTelegramMode(true)}
              >
                <svg className="w-5 h-5 absolute left-4 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.882-.662 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span>{t("continue_with_telegram")}</span>
              </Button>
            </>
          ) : (
            <form onSubmit={submitTelegramLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="telegram_id">{t("telegram_user_id")}</Label>
                <Input 
                  id="telegram_id" 
                  placeholder={t("login_id_placeholder")}
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telegram_code">{t("login_otp_code")}</Label>
                <Input 
                  id="telegram_code" 
                  placeholder={t("login_code_placeholder")} 
                  type="text"
                  maxLength={6}
                  value={telegramCode}
                  onChange={(e) => setTelegramCode(e.target.value)}
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
        <CardFooter className="flex flex-col space-y-4 pt-4 dark:border-t text-center text-xs text-muted-foreground">
          <p>{t("terms_privacy_policy")}</p>
        </CardFooter>
      </Card>
    </div>
  );
}
