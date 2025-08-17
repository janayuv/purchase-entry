import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { invoke } from "@tauri-apps/api/core";
import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export function RegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Username and password are required.",
        variant: "destructive",
      });
      return;
    }
    try {
      await invoke("register", { payload: { username, password } });
      toast({
        title: "Success",
        description: "Account created successfully. Please login.",
      });
      navigate("/login");
    } catch (err) {
      toast({
        title: "Error",
        description: err as string,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Register</CardTitle>
          <CardDescription>Create a new account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setUsername(e.target.value)
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              required
            />
          </div>
          <Button onClick={handleRegister} className="w-full">
            Register
          </Button>
          <div className="text-center text-sm">
            Already have an account?{" "}
            <a href="/#/login" className="underline">
              Login
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
