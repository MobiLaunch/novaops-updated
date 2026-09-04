import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { CircleAlert, Eye, EyeOff, Lock, LogIn, Mail, Wrench } from "lucide-react";
import {
  Alert,
  Button,
  Card,
  Chip,
  FieldError,
  Form,
  InputGroup,
  Label,
  Spinner,
  TextField,
} from "@heroui/react";

import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/lib/AuthContext";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const supabaseReady = isSupabaseConfigured();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password);

      if (!result.ok) setError(result.error || "Incorrect credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6">
      <div className="pointer-events-none absolute -left-24 -top-28 size-[500px] rounded-full bg-[radial-gradient(ellipse,var(--accent-soft)_0%,transparent_70%)] blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 size-[400px] rounded-full bg-[radial-gradient(ellipse,var(--accent)_8%,transparent_70%)] opacity-40 blur-[80px]" />

      <div className="absolute right-5 top-5 z-[1]">
        <ThemeToggle />
      </div>

      <main className="relative z-[1] w-full max-w-[420px]">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Wrench className="size-5" />
          </span>
          <div>
            <strong className="block text-foreground">NovaOps</strong>
            <Chip color="default" size="sm">
              <Chip.Label>Repair Shop Console</Chip.Label>
            </Chip>
          </div>
        </div>

        <Card className="rounded-[32px] bg-surface/85 p-8 shadow-[0_4px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl">
          <Card.Header className="mb-1 pb-0">
            <span className="mb-1 block text-caption font-bold uppercase tracking-widest text-accent">
              Shop workspace
            </span>
            <Card.Title className="text-2xl">Welcome back</Card.Title>
            <Card.Description>
              {supabaseReady
                ? "Sign in with your Supabase account."
                : "Configure Supabase to enable sign-in."}
            </Card.Description>
          </Card.Header>

          <Card.Content className="flex flex-col gap-4 pt-4">
            {!supabaseReady && (
              <Alert role="status" status="danger">
                <Alert.Indicator>
                  <CircleAlert className="size-4" />
                </Alert.Indicator>
                <Alert.Content>
                  <Alert.Description>
                    Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before signing in.
                  </Alert.Description>
                </Alert.Content>
              </Alert>
            )}

            {error && (
              <Alert role="alert" status="danger">
                <Alert.Indicator>
                  <CircleAlert className="size-4" />
                </Alert.Indicator>
                <Alert.Content>
                  <Alert.Description>{error}</Alert.Description>
                </Alert.Content>
              </Alert>
            )}

            <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <TextField
                isRequired
                className="flex flex-col gap-1.5"
                isDisabled={!supabaseReady}
                type="email"
                value={email}
                onChange={setEmail}
              >
                <Label>Email</Label>
                <InputGroup>
                  <InputGroup.Prefix>
                    <Mail className="size-4" />
                  </InputGroup.Prefix>
                  <InputGroup.Input autoComplete="email" />
                </InputGroup>
                <FieldError />
              </TextField>

              <TextField
                isRequired
                className="flex flex-col gap-1.5"
                isDisabled={!supabaseReady}
                type={showPw ? "text" : "password"}
                value={password}
                onChange={setPassword}
              >
                <Label>Password</Label>
                <InputGroup>
                  <InputGroup.Prefix>
                    <Lock className="size-4" />
                  </InputGroup.Prefix>
                  <InputGroup.Input autoComplete="current-password" />
                  <InputGroup.Suffix>
                    <button
                      aria-label={showPw ? "Hide password" : "Show password"}
                      tabIndex={-1}
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                    >
                      {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </InputGroup.Suffix>
                </InputGroup>
                <FieldError />
              </TextField>

              <Button fullWidth isDisabled={!supabaseReady || loading} size="lg" type="submit" variant="primary">
                {loading ? <Spinner size="sm" /> : <LogIn className="size-4" />}
                <span>{loading ? "Signing in…" : "Sign in"}</span>
              </Button>
            </Form>

            <p className="m-0 text-center text-sm text-muted">
              Uses the same Supabase account as your Mobicare website's admin login.
            </p>
          </Card.Content>
        </Card>
      </main>
    </div>
  );
}
