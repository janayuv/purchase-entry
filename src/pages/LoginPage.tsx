import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/useAppStore";
import { invoke } from "@tauri-apps/api/core";
import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { LoginResponse } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAppStore();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Username and password are required.",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await invoke<LoginResponse>("login", { payload: { username, password } });
      login(res.user, res.token);
      navigate("/");
    } catch (err) {
      toast({
        title: "Error",
        description: err as string,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-svh flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to access the application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button onClick={handleLogin} className="w-full">
            Login
          </Button>
          <div className="text-center text-sm">
            Don't have an account?{" "}
            <a href="/#/register" className="underline">
              Register
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}