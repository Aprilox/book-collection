## 📚 Book Collection – Gérez votre bibliothèque comme un pro

> Petite app perso pour centraliser toute ma collection de livres / BD avec une interface moderne, des listes de lecture et une wishlist pratique.

### 🖼 Aperçu

![image](https://raw.githubusercontent.com/Aprilox/book-collection/main/.github/assets/demo.gif)

---

### ✨ Fonctionnalités principales

- **Authentification**  
  - Connexion via un mot de passe administrateur (`admin123` au premier lancement, modifiable ensuite).  
  - Protection contre les tentatives de connexion abusives (verrouillage temporaire, délais progressifs entre essais).

- **Gestion de collection de livres**  
  - Ajout, édition, suppression de livres (`titre`, `auteur`, `série`, `état`, `note`, `notes`, etc.).  
  - Téléchargement automatique des couvertures distantes vers `public/book-covers`.  
  - Vérifications et messages d’erreur côté serveur (titre/auteur obligatoires, note 1–5, etc.).

- **Liste de souhaits (wishlist)**  
  - Ajout de livres que vous ne possédez pas encore.  
  - Déplacement d’un livre de la wishlist vers la collection.

- **Dossiers de lecture / ordres de lecture**  
  - Création de dossiers de lecture (par série, auteur, thématique…).  
  - Ajout de livres dans un dossier avec un ordre de lecture et des notes.  
  - Réorganisation de l’ordre des livres (drag & drop côté UI).

- **Recherche & intégrations externes**  
  - APIRoutes pour interroger **ComicVine**, **MangaDex**, **Bedetheque**, etc. (voir `app/api/*`).  
  - Possibilité d’enregistrer des clés API (par ex. `ComicVine`) via le **menu Paramètres**.

- **Interface moderne**  
  - Composants UI basés sur Radix UI + Tailwind (voir `components/ui/*`).  
  - Thème sombre par défaut, design responsive.  
  - Toasters, dialogues, formulaires ergonomiques.

### 🛠 Stack technique

- **Framework** : Next.js 15 (`app` router, composants serveur & client).  
- **Langage** : TypeScript.  
- **UI** : React 18, Radix UI, Tailwind CSS.  
- **Stockage** : fichier JSON local `data/library.json` (géré par `lib/db.ts`).  
- **Autres librairies** : `react-hook-form`, `zod`, `date-fns`, `embla-carousel-react`, `recharts`, `lucide-react`, etc.

### ✅ Prérequis

- Node.js 18+ recommandé.  
- **pnpm** (conseillé) ou **npm**/**yarn** pour gérer les dépendances.

### 🚀 Installation

1. Cloner le dépôt :

```bash
git clone https://github.com/Aprilox/book-collection.git
cd book-collection
```

2. Installer les dépendances (avec pnpm) :

```bash
pnpm install
```

> Vous pouvez aussi utiliser `npm install` ou `yarn`, selon vos habitudes.

### 🧩 Lancement en développement

```bash
pnpm dev
```

L’application sera disponible sur `http://localhost:7003`.

### 📦 Build & production locale

1. Construire le projet :

```bash
pnpm build
```

2. Lancer le serveur de production :

```bash
pnpm start
```

Par défaut : `http://127.0.0.1:8003`.

### 💾 Données & persistance

> ⚠️ Ce projet est une **démo** pensée pour un usage local / perso, pas pour un déploiement en production tel quel.

- Les données utilisateur sont actuellement stockées **en local** dans le fichier `data/library.json`.  
- Au premier lancement, un utilisateur `admin` est créé avec :
  - **Mot de passe** : `admin123`  
  - Collections vides (livres, wishlist, dossiers de lecture).  
- Les images de couvertures téléchargées sont enregistrées dans `public/book-covers`.  
- Pour un usage plus propre et robuste (prod, multi‑instances, sauvegardes…), il est recommandé de **remplacer ce stockage fichier** par une **base de données externe** (PostgreSQL, MySQL, MongoDB, etc.) et d’adapter `lib/db.ts` en conséquence.

### 🔐 Authentification & sécurité

- Authentification gérée côté serveur via `lib/auth.ts` et `lib/db.ts`.  
- Mécanismes inclus :
  - Suivi des tentatives de connexion.  
  - Verrouillage temporaire du compte après plusieurs échecs (`MAX_ATTEMPTS`, durée de verrouillage, etc.).  
  - Délais progressifs entre les tentatives pour limiter le brute force.  
- Le mot de passe peut être modifié via le **menu Paramètres** (voir bouton en haut à droite de la page d’accueil une fois connecté).

### 🔑 Configuration des clés API

- Les clés API (par ex. `ComicVine`) sont stockées dans `data/library.json` dans la section `apiKeys` de l’utilisateur admin.  
- Une valeur par défaut peut être fournie via la variable d’environnement `COMIC_VINE_API_KEY`.  
- Vous pouvez les modifier via le **SettingsMenu** dans l’interface.

### 📁 Structure du projet (résumé)

- `app/` : pages Next.js (login, page d’accueil, API routes).  
- `components/` : composants UI métiers (cartes de livres, dialogues, panels, etc.).  
- `components/ui/` : bibliothèque de composants génériques (boutons, inputs, modales…).  
- `lib/` : logique côté serveur et utilitaires (`db.ts`, `auth.ts`, `image-utils.ts`, etc.).  
- `data/` : fichier `library.json` contenant les données utilisateur.  
- `types/` : types TypeScript pour les livres et les dossiers de lecture.

### 📜 Scripts disponibles

- `pnpm dev` : lance le serveur de développement sur le port 7003.  
- `pnpm build` : build de production.  
- `pnpm start` : lance le serveur de production (port 8003).  
- `pnpm lint` : exécute `next lint`.

### ⚠️ Remarques & limitations

- Projet conçu comme **programme démo** / sandbox perso.  
- Le système est pensé pour **un seul utilisateur admin** (pas de gestion multi‑comptes).  
- Les données sont stockées **en clair** dans un simple fichier JSON local, ce qui n’est **pas adapté** pour un déploiement pro (sécurité, scalabilité, backups, concurrence d’accès…).  
- Pour un vrai usage production, il faut :
  - brancher la persistance sur une **DB externe** (et éventuellement un ORM),  
  - ajouter une vraie gestion des utilisateurs / droits,  
  - renforcer la sécurité (hash des mots de passe, secrets, HTTPS, etc.),  
  - prévoir un environnement d’hébergement (VPS, PaaS, Docker, etc.).  
- Si vous supprimez `data/library.json`, il sera recréé à partir des valeurs par défaut au prochain lancement (reset complet des données).

### 📄 Licence

Ce projet est fourni pour un **usage privé et personnel uniquement**.  
Vous êtes libre de **l’utiliser, le cloner et le modifier pour vos besoins personnels**, mais :

- **Toute utilisation commerciale / revente / hébergement public de type “service” est interdite sans accord explicite préalable.**  
- Merci de **ne pas republier** le projet tel quel sous un autre nom ou compte dans un but de diffusion publique ou commerciale.

Les **issues** et suggestions d’amélioration sont les bienvenues sur le dépôt GitHub.  
Forks et modifications à but **strictement personnel** sont autorisés.
