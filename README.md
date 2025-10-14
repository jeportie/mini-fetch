# @jeportie/mini-fetch

A lightweight, framework-agnostic Fetch + Auth layer for SPAs.

## ✨ Features
- Typed wrapper around `fetch`
- Automatic JWT injection and refresh
- `AuthService` for session management
- `requireAuth()` route guards
- Safe helpers: `safeGet()` / `safePost()`

---

## 🧱 Installation

```bash
npm install @jeportie/mini-fetch
````

or locally:

```bash
npm link
```

---

## 🧩 Usage Example

```ts
import { Fetch, AuthService, safePost } from "@jeportie/mini-fetch";

const auth = new AuthService({ storageKey: "session" });

const API = new Fetch("/api", {
  getToken: () => auth.getToken(),
  onToken: (t) => auth.setToken(t),
  refreshFn: async () => {
    const tok = await refreshToken();
    if (tok) { auth.setToken(tok); return true; }
    return false;
  },
});

const { data, error } = await safePost(API, "/auth/login", { user, pwd });
if (error) console.error(error.message);
```

---

## 🧰 License

MIT © Jérôme Portier

---
