import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowLeft, Mail, Lock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast({
            variant: "destructive",
            title: "Erro ao entrar",
            description: error.message === "Invalid login credentials" 
              ? "Email ou senha incorretos" 
              : error.message,
          });
        } else {
          toast({
            title: "Bem-vindo de volta!",
            description: "Login realizado com sucesso.",
          });
          navigate("/dashboard");
        }
      } else {
        const { error } = await signUp(formData.email, formData.password, formData.name);
        if (error) {
          toast({
            variant: "destructive",
            title: "Erro ao criar conta",
            description: error.message === "User already registered"
              ? "Este email já está cadastrado"
              : error.message,
          });
        } else {
          toast({
            title: "Conta criada com sucesso!",
            description: "Redirecionando para o dashboard...",
          });
          navigate("/dashboard");
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1.5s' }} />
      
      <div className="relative z-10 p-4">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </Link>
      </div>
      
      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <Card variant="elevated" className="w-full max-w-md animate-slide-up">
          <CardHeader className="text-center">
            <Link to="/" className="flex items-center justify-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
            </Link>
            <CardTitle className="text-2xl">
              {isLogin ? "Entrar na sua conta" : "Criar sua conta"}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? "Digite seu email e senha para acessar" 
                : "Preencha os dados abaixo para começar"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome"
                      className="pl-10"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                variant="gradient" 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Carregando..." : (isLogin ? "Entrar" : "Criar Conta")}
              </Button>
            </form>
            
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}
              </span>{" "}
              <button
                type="button"
                className="text-primary font-medium hover:underline"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Criar conta" : "Entrar"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
