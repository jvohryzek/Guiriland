# Deploying Guiriland

## First Private Share

Use Vercel with Deployment Protection enabled, preferably Password Protection, while testing with friends. Share the protected deployment URL and password only with the group.

For stronger email-based access later, put the site behind Cloudflare Access or add a real auth flow.

## Vercel Settings

Import the GitHub repository into Vercel. The included `vercel.json` sets the build command and output directory automatically.

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

Environment variables:

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_LEADERBOARD_TABLE=guiriland_scores
```

Without the Supabase variables, the game still works and stores the leaderboard in the browser's local storage.

## GitHub Push

From this project folder:

```bash
git add .
git commit -m "Prepare Guiriland for private web playtest"
git remote add origin git@github.com:YOUR_USER/YOUR_REPO.git
git push -u origin visual/guiriland-aesthetics-preview
```

If the remote already exists, skip the `git remote add origin ...` line.

## Supabase

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `docs/supabase-leaderboard.sql`.
4. Copy the project URL and anon key from Supabase settings.
5. Add them as Vercel environment variables.

Keep the Supabase service role key private. Never add it to Vite environment variables or client-side code.

## Score Formula

```text
final score = guiris sprayed * 100 + seconds left * 10 - locals hit * 50
```
