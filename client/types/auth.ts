export type SignOutAction = {
  isLoading: boolean;
  onPress: () => void;
};

export type AuthStatus =
  | { phase: "loading" }
  | { phase: "ready" }
  | { phase: "failed"; pending: "none" | "retry" | "signOut" };
