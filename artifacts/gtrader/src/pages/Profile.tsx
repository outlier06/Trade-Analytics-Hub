import { useState, useRef } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { User, Lock, Save, AlertCircle, CheckCircle2, Eye, EyeOff, ArrowLeft, Camera, X } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-card-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl brand-bg flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4 text-white" />
        </div>
        <h2 className="text-base font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-muted/50 border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form state
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Profile picture state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.profileImageUrl ?? null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const displayUrl = avatarPreview ?? avatarUrl;
  const initials = firstName
    ? `${firstName[0]}${lastName?.[0] ?? ""}`.toUpperCase()
    : (user?.email?.[0] ?? "U").toUpperCase();

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview immediately
    const reader = new FileReader();
    reader.onload = ev => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setAvatarUploading(true);
    try {
      // 1. Get a presigned upload URL
      const presignRes = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: file.name, contentType: file.type }),
      });
      if (!presignRes.ok) {
        const data = await presignRes.json() as { error?: string };
        throw new Error(data.error ?? "Erro ao preparar upload.");
      }
      const { uploadURL, objectPath } = await presignRes.json() as { uploadURL: string; objectPath: string };

      // 2. Upload the file directly to GCS via signed URL
      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Erro ao enviar ficheiro.");

      // 3. Build public URL: objectPath = "/objects/..." → served via /api/storage/objects/...
      const pathSuffix = objectPath.replace(/^\/objects/, "");
      const publicUrl = `/api/storage/objects${pathSuffix}`;

      // 4. Save to profile
      const profileRes = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() || null, email: email.trim(), profileImageUrl: publicUrl }),
      });
      const profileData = await profileRes.json() as { error?: string };
      if (!profileRes.ok || profileData.error) throw new Error(profileData.error ?? "Erro ao guardar foto.");

      setAvatarUrl(publicUrl);
      setAvatarPreview(null);
      await refreshUser();
      toast({ title: "Foto actualizada", description: "A sua foto de perfil foi guardada." });
    } catch (err: unknown) {
      setAvatarPreview(null);
      toast({ title: "Erro no upload", description: err instanceof Error ? err.message : "Tente novamente.", variant: "destructive" });
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemoveAvatar() {
    setAvatarUploading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() || null, email: email.trim(), profileImageUrl: "" }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Erro ao remover foto.");
      setAvatarUrl(null);
      setAvatarPreview(null);
      await refreshUser();
      toast({ title: "Foto removida" });
    } catch (err: unknown) {
      toast({ title: "Erro", description: err instanceof Error ? err.message : "Tente novamente.", variant: "destructive" });
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    if (!firstName.trim()) { setProfileError("O primeiro nome é obrigatório."); return; }

    setProfileLoading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() || null, email: email.trim() }),
      });
      const data = await res.json() as { user?: unknown; error?: string };
      if (!res.ok || data.error) {
        setProfileError(data.error ?? "Erro ao guardar perfil.");
      } else {
        await refreshUser();
        toast({ title: "Perfil actualizado", description: "As suas informações foram guardadas com sucesso." });
      }
    } catch {
      setProfileError("Erro de rede. Tente novamente.");
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    if (!currentPassword) { setPasswordError("Introduza a password actual."); return; }
    if (newPassword.length < 6) { setPasswordError("A nova password deve ter pelo menos 6 caracteres."); return; }
    if (newPassword !== confirmPassword) { setPasswordError("As passwords não coincidem."); return; }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || data.error) {
        setPasswordError(data.error ?? "Erro ao alterar password.");
      } else {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast({ title: "Password alterada", description: "A sua password foi actualizada com sucesso." });
      }
    } catch {
      setPasswordError("Erro de rede. Tente novamente.");
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black text-foreground">Perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie as suas informações pessoais e segurança</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-5 p-5 bg-card border border-card-border rounded-2xl">
        {/* Clickable avatar */}
        <div className="relative group flex-shrink-0">
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Avatar"
              className="w-16 h-16 rounded-2xl object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl brand-bg flex items-center justify-center">
              <span className="text-xl font-black text-white">{initials}</span>
            </div>
          )}
          {/* Upload overlay */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
          >
            {avatarUploading
              ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Camera className="h-5 w-5 text-white" />
            }
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-foreground">
            {firstName || lastName ? `${firstName} ${lastName}`.trim() : "Trader"}
          </p>
          <p className="text-sm text-muted-foreground">{email}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Membro OUTLIER</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-semibold transition-colors disabled:opacity-50"
          >
            <Camera className="h-3.5 w-3.5" />
            {avatarUploading ? "A enviar..." : "Alterar foto"}
          </button>
          {displayUrl && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              disabled={avatarUploading}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 font-semibold transition-colors disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Personal Info */}
      <Section icon={User} title="Informações Pessoais">
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Primeiro nome">
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Nome"
                required
                className={inputCls}
              />
            </FieldGroup>
            <FieldGroup label="Apelido">
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Apelido"
                className={inputCls}
              />
            </FieldGroup>
          </div>

          <FieldGroup label="Email">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              required
              className={inputCls}
            />
          </FieldGroup>

          {profileError && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {profileError}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileLoading}
              className="flex items-center gap-2 px-5 py-2.5 brand-bg text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60"
            >
              {profileLoading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> A guardar...</>
                : <><Save className="h-4 w-4" /> Guardar Alterações</>
              }
            </button>
          </div>
        </form>
      </Section>

      {/* Password */}
      <Section icon={Lock} title="Alterar Password">
        <form onSubmit={handlePasswordSave} className="space-y-4">
          <FieldGroup label="Password actual">
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Introduza a password actual"
                autoComplete="current-password"
                className={`${inputCls} pr-10`}
              />
              <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FieldGroup>

          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Nova password">
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  className={`${inputCls} pr-10`}
                />
                <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FieldGroup>

            <FieldGroup label="Confirmar password">
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova password"
                  autoComplete="new-password"
                  className={`${inputCls} pr-10`}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FieldGroup>
          </div>

          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle className="h-3.5 w-3.5" /> As passwords não coincidem
            </div>
          )}
          {newPassword && confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
            <div className="flex items-center gap-2 text-sm text-green-500">
              <CheckCircle2 className="h-3.5 w-3.5" /> As passwords coincidem
            </div>
          )}

          {passwordError && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {passwordError}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordLoading}
              className="flex items-center gap-2 px-5 py-2.5 brand-bg text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60"
            >
              {passwordLoading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> A alterar...</>
                : <><Lock className="h-4 w-4" /> Alterar Password</>
              }
            </button>
          </div>
        </form>
      </Section>
    </div>
  );
}
